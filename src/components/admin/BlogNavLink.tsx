/**
 * BlogNavLink — Navigation link for Blog Workflow view
 * Rendered in admin sidebar under "Custom Views"
 */

import React from "react";
import { useConfig } from "@payloadcms/ui";

export function BlogNavLink() {
  const { admin } = (useConfig() as any);

  return (
    <a
      href={`${admin?.baseURL}/blog-workflow`}
      style={{
        display: "block",
        padding: "12px 16px",
        fontSize: "14px",
        color: "inherit",
        textDecoration: "none",
        borderLeft: "3px solid transparent",
        marginBottom: "4px",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = "currentColor";
        e.currentTarget.style.backgroundColor = "var(--theme-elevation-50)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = "transparent";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      📝 Blog Workflow
    </a>
  );
}
