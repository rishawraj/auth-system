import { createFileRoute } from "@tanstack/react-router";

import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <>
      <NavBar />
      <div className="from-background to-secondary min-h-screen bg-gradient-to-b px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
              About Our Auth System
            </h1>
            <p className="text-text mt-6 text-lg leading-8">
              A modern, secure authentication system built with React,
              TypeScript, and industry best practices.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <details className="group bg-opacity-80 rounded-lg border border-[var(--color-secondary)] bg-[var(--color-background)] p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between">
                <h2 className="text-lg font-medium text-[var(--color-text)]">
                  Features
                </h2>
                <span className="ml-6 flex h-7 items-center">
                  <svg
                    className="h-6 w-6 rotate-0 transform text-[var(--color-secondary)] transition-transform duration-200 ease-in-out group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-[var(--color-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="ml-3 text-[var(--color-text)]">
                    Secure user authentication with JWT tokens
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-[var(--color-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="ml-3 text-[var(--color-text)]">
                    Password reset and email verification
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-[var(--color-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="ml-3 text-[var(--color-text)]">
                    OAuth integration with Google
                  </p>
                </div>
              </div>
            </details>

            <details className="group bg-opacity-80 rounded-lg border border-[var(--color-secondary)] bg-[var(--color-background)] p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between">
                <h2 className="text-lg font-medium text-[var(--color-text)]">
                  Technology Stack
                </h2>
                <span className="ml-6 flex h-7 items-center">
                  <svg
                    className="h-6 w-6 rotate-0 transform text-[var(--color-secondary)] transition-transform duration-200 ease-in-out group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-[var(--color-text)]">
                  Built with modern technologies including:
                </p>
                <ul className="list-inside list-disc space-y-2 text-[var(--color-text)]">
                  <li>React with TypeScript for type-safe development</li>
                  <li>TanStack Router for efficient routing</li>
                  <li>Tailwind CSS for responsive styling</li>
                  <li>Node.js backend with Express</li>
                  <li>PostgreSQL database for data persistence</li>
                </ul>
              </div>
            </details>

            <details className="group bg-opacity-80 rounded-lg border border-[var(--color-secondary)] bg-[var(--color-background)] p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between">
                <h2 className="text-lg font-medium text-[var(--color-text)]">
                  Security
                </h2>
                <span className="ml-6 flex h-7 items-center">
                  <svg
                    className="h-6 w-6 rotate-0 transform text-[var(--color-secondary)] transition-transform duration-200 ease-in-out group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-[var(--color-text)]">
                  Security is our top priority. Our system implements:
                </p>
                <ul className="list-inside list-disc space-y-2 text-[var(--color-text)]">
                  <li>Secure password hashing with bcrypt</li>
                  <li>JWT-based authentication</li>
                  <li>HTTPS-only communication</li>
                  <li>Protection against common web vulnerabilities</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
