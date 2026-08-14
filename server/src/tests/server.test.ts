import { describe, test, expect } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";

const getApp = () => http.createServer(handler);

describe("HTTP Server & Core Health Routes", () => {
  test("GET /health returns 200 with health status message", async () => {
    const res = await request(getApp()).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Server is healthy");
  });

  test("GET /admin/health returns 200 with admin health status", async () => {
    const res = await request(getApp()).get("/admin/health");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Server is healthy");
  });

  test("GET /unknown-route returns 404 Not Found", async () => {
    const res = await request(getApp()).get("/unknown-route");
    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Not Found");
  });

  test("POST /unknown-route returns 404 Not Found", async () => {
    const res = await request(getApp()).post("/unknown-route").send({});
    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Not Found");
  });
});
