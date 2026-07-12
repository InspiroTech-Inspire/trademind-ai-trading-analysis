import { authRouter } from "./auth-router";
import { marketRouter } from "./market-router";
import { analysisRouter } from "./analysis-router";
import { watchlistRouter } from "./watchlist-router";
import { alertsRouter } from "./alerts-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  market: marketRouter,
  analysis: analysisRouter,
  watchlist: watchlistRouter,
  alerts: alertsRouter,
});

export type AppRouter = typeof appRouter;
