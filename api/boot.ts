import { Hono } from "hono";
import { trpcServer } from "@trpc/server/adapters/hono";
import { appRouter } from "./router";
import { serveStatic } from "@hono/node-server/serve-static";
import { createContext } from "./lib/vite";
import { setupAuth } from "./kimi/auth";

const app = new Hono();

// Auth routes
setupAuth(app);

// tRPC API
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Static files
app.use("/*", serveStatic({ root: "./dist/public" }));

// SPA fallback
app.get("*", serveStatic({ path: "./dist/public/index.html" }));

export default app;
