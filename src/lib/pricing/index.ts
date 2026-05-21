/**
 * Pricing engine entry point.
 *
 * - computeProductPrice: convenience wrapper for single-product callers
 *   (loads a rate snapshot, then computes). Used by /api/quote.
 * - For many products (collection pages), call loadRateSnapshot ONCE then
 *   computePriceFromSnapshot per product — avoids N×5 DB queries.
 *
 * All pricing math lives in ./snapshot.ts (single source of truth).
 */
import type { Payload } from "payload";
import type { PriceBreakup, PricingInput } from "./types";
import { computePriceFromSnapshot, loadRateSnapshot } from "./snapshot";

export { loadRateSnapshot, computePriceFromSnapshot };
export type { RateSnapshot } from "./snapshot";

export async function computeProductPrice(
  payload: Payload,
  input: PricingInput,
): Promise<PriceBreakup> {
  const snapshot = await loadRateSnapshot(payload);
  return computePriceFromSnapshot(snapshot, input);
}
