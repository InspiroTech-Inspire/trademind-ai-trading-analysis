import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { alerts } from "@db/schema";
import { eq, isNull } from "drizzle-orm";

export const alertsRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(alerts).where(isNull(alerts.triggeredAt));
  }),

  create: publicQuery
    .input(
      z.object({
        symbol: z.string().toUpperCase(),
        timeframe: z.enum(["1d", "4h", "1h", "30m", "15m", "5m"]),
        condition: z.enum([
          "price_above",
          "price_below",
          "rsi_above",
          "rsi_below",
          "macd_bullish",
          "macd_bearish",
          "signal_buy",
          "signal_sell",
          "pattern_detected",
        ]),
        threshold: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const values: any = {
        symbol: input.symbol,
        timeframe: input.timeframe,
        condition: input.condition,
        threshold: input.threshold ? String(input.threshold) : undefined,
      };
      if (ctx.user?.id) {
        values.userId = ctx.user.id;
      }
      const result = await db.insert(alerts).values(values);
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(alerts).where(eq(alerts.id, input.id));
      return { success: true };
    }),

  deactivate: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(alerts)
        .set({ isActive: false })
        .where(eq(alerts.id, input.id));
      return { success: true };
    }),
});
