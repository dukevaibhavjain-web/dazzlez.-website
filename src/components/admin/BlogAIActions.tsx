"use client";

/**
 * BlogAIActions — Sidebar field with AI-powered actions
 * Includes: regenerate excerpt, suggest keywords, generate hero SVG, get publish time recommendation
 */

import React, { useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";

export function BlogAIActions() {
  const { id } = useDocumentInfo();
  const { getFieldValue, setFieldValue } = useFormFields();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const title = getFieldValue("title") as string;
  const excerpt = getFieldValue("excerpt") as string;
  const keywordId = getFieldValue("keyword") as string;
  const category = getFieldValue("category") as string;

  const buttonStyle = (active?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "8px 12px",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 600,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: active ? "#0066CC" : "var(--theme-elevation-100)",
    color: active ? "white" : "var(--theme-text)",
    transition: "all 0.2s",
    opacity: isLoading ? 0.6 : 1,
    pointerEvents: isLoading ? "none" : "auto",
  });

  const handleRegenerateExcerpt = async () => {
    if (!title) {
      alert("Title required");
      return;
    }

    setIsLoading("excerpt");
    try {
      const response = await fetch("/api/admin/blog/regenerate-excerpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id, title }),
      });

      if (!response.ok) throw new Error("Failed to regenerate excerpt");
      const { excerpt: newExcerpt } = await response.json();
      await setFieldValue("excerpt", newExcerpt);
      alert("Excerpt updated!");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(null);
    }
  };

  const handleSuggestKeywords = async () => {
    if (!title) {
      alert("Title required");
      return;
    }

    setIsLoading("keywords");
    try {
      const response = await fetch("/api/admin/blog/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id, title }),
      });

      if (!response.ok) throw new Error("Failed to suggest keywords");
      const { keywords } = await response.json();
      alert(`Suggested keywords:\n\n${keywords.join("\n")}`);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(null);
    }
  };

  const handleGenerateHeroSvg = async () => {
    if (!title) {
      alert("Title required");
      return;
    }

    setIsLoading("hero");
    try {
      const response = await fetch("/api/admin/blog/hero-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: id,
          title,
          category: category || "Insights",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate hero SVG");
      const { svgUrl } = await response.json();
      await setFieldValue("heroImage", { url: svgUrl, alt: title });
      alert("Hero SVG generated and set!");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(null);
    }
  };

  const handleGetPublishTimeRecommendation = async () => {
    setIsLoading("timing");
    try {
      const response = await fetch("/api/admin/blog/optimize-timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Cannot get recommendation: ${error.error}`);
        return;
      }

      const { recommendedSlot, reason } = await response.json();
      alert(
        `Recommended publish time: ${recommendedSlot}\n\nReasoning:\n${reason}`
      );
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "var(--theme-elevation-50)",
        borderRadius: "4px",
        marginBottom: "16px",
        border: "1px solid var(--theme-elevation-100)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--theme-text)",
        }}
      >
        🤖 AI Actions
      </div>

      <button
        style={buttonStyle(isLoading === "excerpt")}
        onClick={handleRegenerateExcerpt}
        disabled={!!isLoading}
      >
        {isLoading === "excerpt" ? "⏳ Generating..." : "Regenerate Excerpt"}
      </button>

      <button
        style={buttonStyle(isLoading === "keywords")}
        onClick={handleSuggestKeywords}
        disabled={!!isLoading}
      >
        {isLoading === "keywords" ? "⏳ Suggesting..." : "Suggest Keywords"}
      </button>

      <button
        style={buttonStyle(isLoading === "hero")}
        onClick={handleGenerateHeroSvg}
        disabled={!!isLoading}
      >
        {isLoading === "hero" ? "⏳ Creating..." : "Generate Hero SVG"}
      </button>

      <button
        style={buttonStyle(isLoading === "timing")}
        onClick={handleGetPublishTimeRecommendation}
        disabled={!!isLoading}
      >
        {isLoading === "timing"
          ? "⏳ Analyzing..."
          : "Get Publish Time Recommendation"}
      </button>
    </div>
  );
}
