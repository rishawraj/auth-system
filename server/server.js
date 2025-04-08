const https = require("http");
const { handleRequest } = require("./utils/helpers");

const server = https.createServer(async (req, res) => {
  await handleRequest(req, res);
});

server.listen(3000, () => {
  console.log("server is running on http://localhost:3000");
});
