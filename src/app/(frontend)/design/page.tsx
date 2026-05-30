/**
 * /design — Design Advisor landing page.
 *
 * Fetches chatbot config from CMS (ChatbotConfig global) and passes it to
 * the DesignAdvisor client component. Falls back to hardcoded defaults when
 * no config is saved yet.
 *
 * URL params supported (for Meta ad pre-fill):
 *   ?occasion=Gift         → jumps to product step with occasion pre-set
 *   ?product=rings         → jumps to budget step with product pre-set
 *
 * Revalidates every 60 s so admin changes go live quickly without a deploy.
 */

import type { Metadata } from "next";
import { DesignAdvisor } from "@/components/storefront/home/DesignAdvisor";
import { getChatbotConfig } from "@/lib/storefront/chatbotConfig";
// getChatbotConfig now returns FlowConfig — DesignAdvisor accepts it as flowConfig prop

export const revalidate = 60; // ISR: 1-minute TTL

export const metadata: Metadata = {
  title: "Design Your Jewellery | The Dazzlez",
  description:
    "Answer a few questions and we'll match you with the perfect certified diamond jewellery — rings, earrings, pendants, bracelets. Transparent pricing. Made to order.",
  openGraph: {
    title: "Design Your Jewellery | The Dazzlez",
    description:
      "Lab-grown & natural diamond jewellery, personalised for your occasion and budget.",
    images: [{ url: "/logo-square.jpg", width: 1080, height: 1080 }],
  },
};

type SearchParams = { occasion?: string; product?: string };

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, chatbotConfig] = await Promise.all([
    searchParams,
    getChatbotConfig(),
  ]);

  return (
    <DesignAdvisor
      flowConfig={chatbotConfig}
      initialOccasion={params.occasion}
      initialProduct={params.product}
      whatsappNumber="+919829115205"
    />
  );
}
