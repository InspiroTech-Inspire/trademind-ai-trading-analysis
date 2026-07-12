import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { watchlists, watchlistItems } from "@db/schema";
import { eq } from "drizzle-orm";

export const watchlistRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const allWatchlists = await db.select().from(watchlists);
    const allItems = await db.select().from(watchlistItems);

    return allWatchlists.map((wl) => ({
      ...wl,
      items: allItems.filter((item) => item.watchlistId === wl.id),
    }));
  }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(watchlists).values({
        name: input.name,
        description: input.description,
        isDefault: input.isDefault || false,
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(watchlistItems).where(eq(watchlistItems.watchlistId, input.id));
      await db.delete(watchlists).where(eq(watchlists.id, input.id));
      return { success: true };
    }),

  addItem: publicQuery
    .input(
      z.object({
        watchlistId: z.number(),
        symbol: z.string().toUpperCase(),
        exchange: z.string().optional(),
        assetType: z.enum(["stock", "crypto", "forex", "etf", "index"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(watchlistItems).values({
        watchlistId: input.watchlistId,
        symbol: input.symbol,
        exchange: input.exchange,
        assetType: input.assetType || "stock",
      });
      return { id: Number(result[0].insertId) };
    }),

  removeItem: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(watchlistItems).where(eq(watchlistItems.id, input.id));
      return { success: true };
    }),
});
