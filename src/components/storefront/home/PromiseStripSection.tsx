type Item = {
  icon?: string | null;
  iconUrl?: string | null;
  title: string;
  description?: string | null;
};

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  backgroundColor?: "white" | "cream" | "navy";
  items: Item[];
};

const BG: Record<string, string> = {
  white: "bg-white",
  cream: "bg-cream-200",
  navy: "bg-navy",
};
const TEXT: Record<string, string> = {
  white: "text-navy",
  cream: "text-navy",
  navy: "text-cream",
};
const MUTED: Record<string, string> = {
  white: "text-muted",
  cream: "text-muted",
  navy: "text-cream/70",
};
const ICON: Record<string, string> = {
  white: "text-gold",
  cream: "text-gold",
  navy: "text-gold",
};

export function PromiseStripSection({
  eyebrow,
  title,
  backgroundColor = "white",
  items,
}: Props) {
  const bg = BG[backgroundColor] ?? BG.white;
  const text = TEXT[backgroundColor] ?? TEXT.white;
  const muted = MUTED[backgroundColor] ?? MUTED.white;
  const icon = ICON[backgroundColor] ?? ICON.white;

  const colCount = items.length <= 2 ? items.length : items.length <= 4 ? 2 : 3;
  const gridClass = colCount === 1
    ? "grid-cols-1"
    : colCount === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <section className={`${bg} py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {(eyebrow || title) && (
          <div className="text-center mb-10">
            {eyebrow && <p className={`eyebrow ${text}`}>{eyebrow}</p>}
            {title && (
              <h2 className={`font-display text-4xl mt-1 ${text}`}>{title}</h2>
            )}
          </div>
        )}

        <div className={`grid ${gridClass} gap-8 text-center`}>
          {items.map((item, idx) => (
            <div key={idx}>
              {item.iconUrl ? (
                <div className="mb-3 flex justify-center">
                  <img src={item.iconUrl} alt={item.title} className="w-10 h-10 object-contain" />
                </div>
              ) : item.icon ? (
                <div className={`text-3xl mb-3 font-display ${icon}`}>{item.icon}</div>
              ) : null}
              <h3 className={`font-display text-xl mb-2 ${text}`}>{item.title}</h3>
              {item.description && (
                <p className={`text-sm leading-relaxed ${muted}`}>{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
