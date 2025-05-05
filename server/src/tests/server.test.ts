// test/server.test.ts
import { describe, test, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.ts";

const server = http.createServer(handler);

describe("Server basic routes", () => {
  test("GET / (unknown route) should return 404", async () => {
    const res = await request(server).get("/unknown-route");
    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Not Found");
  });
});

afterAll(() => {
  server.close();
});
