import userRoutes from "./users.ts";

const routes = [
  userRoutes,
  //  add other route modules to this array
];

export default (req, res) => {
  for (const routeHandler of routes) {
    if (routeHandler(req, res)) {
      return true; // request handled by a router
    }
  }
  return false;
};
