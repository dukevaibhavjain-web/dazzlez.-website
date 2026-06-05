"use client";

/**
 * ImportNavLink — appears in the Payload admin sidebar under the
 * built-in navigation links. Registered via payload.config.ts
 * admin.components.afterNavLinks.
 */
export function ImportNavLink() {
  // Use a plain <a> so it works in both server and client contexts.
  // The `payload-nav-link` className exists in the Payload admin stylesheet.
  return (
    <a
      href="/admin/import"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        fontSize: 13,
        color: "inherit",
        textDecoration: "none",
        borderRadius: 4,
        transition: "background 0.12s",
        marginTop: 4,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--theme-elevation-100, #f0f0f0)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 16 }}>📥</span>
      <span>Bulk Import</span>
    </a>
  );
}

export default ImportNavLink;
