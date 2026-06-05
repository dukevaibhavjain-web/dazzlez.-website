"use client";

/**
 * BlogActionsGroup — Combined UI group for blog publishing and AI actions
 * Wraps BlogPublishButton and BlogAIActions for sidebar placement
 */

import React from "react";
import { BlogPublishButton } from "./BlogPublishButton";
import { BlogAIActions } from "./BlogAIActions";

export function BlogActionsGroup() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <BlogPublishButton />
      <BlogAIActions />
    </div>
  );
}
