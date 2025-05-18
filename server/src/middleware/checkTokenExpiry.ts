import { IncomingMessage, ServerResponse } from "node:http";

export async function checkTokenExpiry(
  req: IncomingMessage,
  res: ServerResponse
) {
  console.log(req, res);
  return true;
}
