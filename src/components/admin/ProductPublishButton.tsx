"use client";

/**
 * Sidebar Publish / Unpublish button.
 *
 * Reads the current status from the live form state.
 *   • Draft  → green "Publish" button   → PATCH status → "active"
 *   • Active → gray "Unpublish" button  → PATCH status → "draft"
 *   • Archived → not shown (manage via the status dropdown)
 *
 * Uses the Payload REST API with the admin session cookie (same-origin).
 * After the update the page reloads so the form reflects the new state.
 *
 * Note: this button operates on the SAVED document. If you have unsaved
 * changes, save first (via the Save button in the header) then publish.
 */
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useCallback, useState } from "react";

export function ProductPublishButton() {
  const { id } = useDocumentInfo();
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined);
  const [busy, setBusy] = useState(false);

  const update = useCallback(
    async (next: "active" | "draft") => {
      if (!id || busy) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (res.ok) window.location.reload();
        else console.error("Publish update failed", await res.text());
      } catch (e) {
        console.error("Publish update error", e);
      } finally {
        setBusy(false);
      }
    },
    [id, busy],
  );

  // New unsaved document has no id yet — tell admin to save first
  if (!id) {
    return (
      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--theme-elevation-400)",
          marginBottom: "1rem",
          fontStyle: "italic",
        }}
      >
        Save the product first to enable publishing.
      </p>
    );
  }

  if (status === "archived") return null; // archived products: use the dropdown

  const isPublished = status === "active";

  return (
    <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
      {/* Preview button — always visible */}
      <PreviewButton />

      {/* Publish / Unpublish */}
      {isPublished ? (
        <button
          onClick={() => update("draft")}
          disabled={busy}
          style={{
            flex: 1,
            padding: "0.45rem 0.75rem",
            fontSize: "0.78rem",
            fontWeight: 500,
            borderRadius: "0.375rem",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-elevation-50)",
            color: "var(--theme-elevation-500)",
            cursor: busy ? "wait" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {busy ? "Saving…" : "Unpublish"}
        </button>
      ) : (
        <button
          onClick={() => update("active")}
          disabled={busy}
          style={{
            flex: 1,
            padding: "0.45rem 0.75rem",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: "0.375rem",
            border: "none",
            background: busy ? "#86EFAC" : "#22C55E",
            color: "#fff",
            cursor: busy ? "wait" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {busy ? "Publishing…" : "Publish"}
        </button>
      )}
    </div>
  );
}

/**
 * Small preview button — opens the public product page in a new tab.
 * Reads slug (or code) from the live form state so the link is always fresh.
 */
function PreviewButton() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined);
  const code = useFormFields(([fields]) => fields.code?.value as string | undefined);

  const href = `/product/${slug ?? code ?? ""}`;
  if (!slug && !code) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3rem",
        padding: "0.45rem 0.75rem",
        fontSize: "0.78rem",
        fontWeight: 500,
        borderRadius: "0.375rem",
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
        color: "var(--theme-elevation-700)",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      <span>↗</span>
      <span>Preview</span>
    </a>
  );
}

export default ProductPublishButton;
