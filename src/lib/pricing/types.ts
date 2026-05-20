export type Purity = "9K" | "14K" | "18K" | "22K" | "Silver925" | "Platinum";
export type DiamondRole = "small" | "solitaire";
export type DiamondCategorySlug = "natural" | "lab-premium" | "lab-standard";

export interface PricingInput {
  /** A Product document (from Payload's local API). */
  product: ProductForPricing;
  metalPurity: Purity;
  diamondCategorySlug: DiamondCategorySlug;
  /**
   * Solitaire carat override — only respected if product.isSolitaire is true.
   * Replaces the center stone's weight for variant pricing (1ct, 2ct, 3ct).
   */
  solitaireCarat?: number;
  /**
   * Ring size (US, e.g. 6 or 6.5). Doesn't affect base price yet but is
   * recorded for the quote so it can flow into manufacturing.
   */
  ringSize?: number;
}

export interface ProductForPricing {
  id: string | number;
  code: string;
  isSolitaire?: boolean;
  category: string | { id: string | number };
  metals?: Array<{ purity: Purity; weightG: number }>;
  diamonds?: Array<{
    role: DiamondRole;
    weightCt: number;
    count: number;
    sizeMm?: string;
    shape?: unknown;
    cut?: string;
    color?: string;
    clarity?: string;
  }>;
  colorStones?: Array<{
    stone: string | { id: string | number; name?: string };
    weightCt: number;
    count: number;
  }>;
}

export interface PriceLineItem {
  label: string;
  detail?: string;
  amountInr: number;
}

export interface PriceBreakup {
  /** INR, rounded to whole rupees. */
  total: number;
  subTotal: number;
  gst: number;
  /** Itemized — used to render the "Price Breakup" accordion on the PDP. */
  lineItems: PriceLineItem[];
  /** Machine-readable breakdown for analytics + invoice. */
  components: {
    metal: { purity: Purity; weightG: number; ratePerG: number; cost: number };
    diamonds: Array<{
      role: DiamondRole;
      weightCt: number;
      count: number;
      ratePerCt: number;
      cost: number;
    }>;
    colorStones: Array<{
      stone: string;
      weightCt: number;
      count: number;
      ratePerCt: number;
      cost: number;
    }>;
    making: { type: string; cost: number };
    gstPct: number;
  };
  /** What this quote was for — echoed back to the client. */
  inputs: {
    productCode: string;
    metalPurity: Purity;
    diamondCategorySlug: DiamondCategorySlug;
    solitaireCarat?: number;
    ringSize?: number;
  };
}

export const GST_RATE_PCT = 3;
