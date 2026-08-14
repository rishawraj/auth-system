import { vi } from "vitest";
import nodemailer from "nodemailer";
import { OAuth2Client, TokenPayload } from "google-auth-library";

export interface MockEmail {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Setup and capture email dispatches via nodemailer
 */
export function setupEmailMock() {
  const sentEmails: MockEmail[] = [];

  const sendMailMock = vi.fn().mockImplementation(async (mailOptions: MockEmail) => {
    sentEmails.push(mailOptions);
    return {
      messageId: `mock-${Date.now()}@example.com`,
      response: "250 2.0.0 OK (Mocked)",
      accepted: [mailOptions.to],
      rejected: [],
    };
  });

  const createTransportSpy = vi
    .spyOn(nodemailer, "createTransport")
    .mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);

  return {
    sentEmails,
    sendMailMock,
    createTransportSpy,
    clearSentEmails: () => {
      sentEmails.length = 0;
      sendMailMock.mockClear();
    },
    restore: () => {
      createTransportSpy.mockRestore();
    },
  };
}

/**
 * Mock Google OAuth library methods (getToken, verifyIdToken, generateAuthUrl)
 */
export function setupGoogleOAuthMock(overrides?: Partial<TokenPayload>) {
  const defaultPayload: TokenPayload = {
    iss: "https://accounts.google.com",
    sub: "google-mock-sub-12345",
    azp: "google-mock-client-id",
    aud: "google-mock-client-id",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: "googleuser@example.com",
    email_verified: true,
    name: "Google Test User",
    picture: "https://example.com/photo.jpg",
    given_name: "Google",
    family_name: "User",
    locale: "en",
    ...overrides,
  };

  const getTokenSpy = vi
    .spyOn(OAuth2Client.prototype, "getToken")
    .mockImplementation(async (_code: string | any) => {
      return {
        tokens: {
          access_token: "mock_google_access_token_123",
          refresh_token: "mock_google_refresh_token_123",
          id_token: "mock_google_id_token_123",
          expiry_date: Date.now() + 3600 * 1000,
        },
        res: null,
      };
    });

  const verifyIdTokenSpy = vi
    .spyOn(OAuth2Client.prototype, "verifyIdToken")
    .mockImplementation(async () => {
      return {
        getPayload: () => defaultPayload,
        getUserId: () => defaultPayload.sub,
        getAttributes: () => ({ payload: defaultPayload, header: {} as any }),
      } as any;
    });

  const generateAuthUrlSpy = vi
    .spyOn(OAuth2Client.prototype, "generateAuthUrl")
    .mockReturnValue(
      "https://accounts.google.com/o/oauth2/v2/auth?mock=true"
    );

  return {
    defaultPayload,
    getTokenSpy,
    verifyIdTokenSpy,
    generateAuthUrlSpy,
    restore: () => {
      getTokenSpy.mockRestore();
      verifyIdTokenSpy.mockRestore();
      generateAuthUrlSpy.mockRestore();
    },
  };
}
