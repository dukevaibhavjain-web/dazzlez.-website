/**
 * FAQ accordion shown on the PDP.
 * Server component — no client JS needed.
 * Native <details>/<summary> handles open/close without any React state.
 * Includes JSON-LD FAQPage schema for Google rich snippets.
 */

export type FAQItem = {
  id: number | string;
  question: string;
  answer: string;
};

export function FAQSection({ faqs }: { faqs: FAQItem[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-16 max-w-3xl">
      <h2 className="font-display text-3xl text-navy mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-sm text-muted mb-6 leading-relaxed">
        Common questions about lab-grown diamonds, pricing, returns, and more.
      </p>

      <div className="space-y-2">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="group border border-cream-200 rounded-lg overflow-hidden"
          >
            <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none bg-white hover:bg-cream-50/70 transition-colors">
              <span className="font-medium text-navy text-sm pr-4 leading-snug">
                {faq.question}
              </span>
              <span
                className="text-gold shrink-0 text-xl leading-none transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="px-5 py-4 bg-cream-50/50 border-t border-cream-200">
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {faq.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* JSON-LD — FAQPage schema for Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
