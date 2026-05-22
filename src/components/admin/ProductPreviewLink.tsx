"use client";

/**
 * Sidebar link that opens the public product page in a new tab.
 * Reads the slug (or falls back to code) live from the form state so the URL
 * is always current — no save needed to get the correct link.
 */
import { useFormFields } from "@payloadcms/ui";

export function ProductPreviewLink() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined);
  const code = useFormFields(([fields]) => fields.code?.value as string | undefined);
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined);

  // Need at least slug or code to build the URL
  if (!slug && !code) return null;

  const href = `/product/${slug ?? code}`;
  const isDraft = status === "draft" || !status;

  return (
    <div
      style={{
        marginBottom: "1.25rem",
        padding: "0.75rem 1rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "0.375rem",
        background: "var(--theme-elevation-50)",
      }}
    >
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--theme-elevation-400)",
          marginBottom: "0.5rem",
        }}
      >
        Storefront Preview
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          color: "var(--theme-elevation-800)",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        <span>↗</span>
        <span>View on site</span>
        {isDraft && (
          <span
            style={{
              fontSize: "0.65rem",
              background: "var(--theme-elevation-100)",
              color: "var(--theme-elevation-500)",
              padding: "0.1rem 0.4rem",
              borderRadius: "0.25rem",
              fontWeight: 400,
            }}
          >
            draft
          </span>
        )}
      </a>
      {isDraft && (
        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--theme-elevation-400)",
            marginTop: "0.35rem",
          }}
        >
          Page visible but not yet in collections.
        </p>
      )}
    </div>
  );
}

export default ProductPreviewLink;
