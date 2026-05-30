import Link from "next/link";

type Props = {
  imageUrl: string;
  mobileImageUrl?: string | null;
  altText?: string | null;
  link?: string | null;
  overlayText?: string | null;
  ctaText?: string | null;
};

export function ImageBannerSection({
  imageUrl,
  mobileImageUrl,
  altText,
  link,
  overlayText,
  ctaText,
}: Props) {
  const hasOverlay = Boolean(overlayText || ctaText);

  const inner = (
    <div className="relative w-full overflow-hidden">
      <picture>
        {mobileImageUrl && (
          <source media="(max-width: 640px)" srcSet={mobileImageUrl} />
        )}
        <img
          src={imageUrl}
          alt={altText ?? ""}
          className="w-full h-52 sm:h-72 md:h-[400px] object-cover"
        />
      </picture>

      {hasOverlay && (
        <>
          <div className="absolute inset-0 bg-navy/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-cream text-center px-4">
            {overlayText && (
              <h2 className="font-display text-3xl md:text-4xl">{overlayText}</h2>
            )}
            {ctaText && (
              <span className="inline-block px-7 py-3 bg-gold text-navy font-medium rounded-full hover:bg-gold/90 transition-colors">
                {ctaText}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block group">
        {inner}
      </Link>
    );
  }

  return inner;
}
