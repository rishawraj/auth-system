import { handleRequest } from "./utils/helpers.js";
import http from "node:http";

const server = http.createServer(async (req, res) => {
  await handleRequest(req, res);
});

server.listen(3000, () => {
  console.log("server is running on http://localhost:3000");
});
