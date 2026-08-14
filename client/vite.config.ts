import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});

// ### How Vite and Deployment work together

// Vite server.proxy ONLY runs during local development (npm run dev).

// When you build for deployment (npm run build or inside Docker), Vite compiles your code
// into static HTML, CSS, and JS files. The server.proxy block is completely ignored during
// production build because Vite does not run a server in production—Nginx serves those
// static files instead.
// ──────
// ### Why this setup is the best practice for both Dev and Deployment:

//  Environment                  │ How requests are made    │ Who handles /api routing?
// ──────────────────────────────┼──────────────────────────┼───────────────────────────────
//  Local Standalone Dev (npm    │ Browser calls /api/login │ Vite Dev Server proxies
//  run dev)                     │                          │ /api/login to
//                               │                          │ http://localhost:3000/login
//  Local Docker (docker compose │ Browser calls /api/login │ Nginx Container proxies
//  up)                          │                          │ /api/login to
//                               │                          │ http://server:3000/login
//  AWS Deployment (EC2)         │ Browser calls /api/login │ Nginx Container proxies
//                               │                          │ /api/login to
//                               │                          │ http://server:3000/login
// ──────
