"use client";

/**
 * BlogPublishButton — Sidebar component for publish state management
 * Shows different actions based on blog status: draft → pending_approval → scheduled → published
 */

import React, { useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";

type Status = "draft" | "pending_approval" | "scheduled" | "published";

export function BlogPublishButton() {
  const { id } = useDocumentInfo();
  const { getFieldValue, setFieldValue } = useFormFields();
  const [isLoading, setIsLoading] = useState(false);

  const status = (getFieldValue("status") as Status) || "draft";
  const slug = getFieldValue("slug") as string;
  const scheduledFor = getFieldValue("scheduledFor") as string | null;

  const handleSubmitForApproval = async () => {
    setIsLoading(true);
    try {
      await setFieldValue("status", "pending_approval");
      alert("Blog submitted for approval!");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    const date = prompt("Schedule for (YYYY-MM-DD HH:mm):");
    if (!date) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/blog/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: id,
          scheduledFor: new Date(date).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule");
      }

      const data = await response.json();
      await setFieldValue("status", "scheduled");
      await setFieldValue("scheduledFor", data.scheduledFor);
      await setFieldValue("abTestSlot", data.abTestSlot);
      alert(`Scheduled for ${data.scheduledFor} (Slot: ${data.abTestSlot})`);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishNow = async () => {
    setIsLoading(true);
    try {
      await setFieldValue("status", "published");
      await setFieldValue("publishedAt", new Date().toISOString());
      alert("Blog published!");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm("Unpublish this blog?")) return;

    setIsLoading(true);
    try {
      await setFieldValue("status", "draft");
      alert("Blog unpublished.");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const viewUrl = slug ? `/blog/${slug}` : null;

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 600,
    border: "none",
    borderRadius: "4px",
    cursor: isLoading ? "not-allowed" : "pointer",
    backgroundColor: "#0066CC",
    color: "white",
    transition: "all 0.2s",
    opacity: isLoading ? 0.6 : 1,
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
      <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--theme-text)" }}>
        Publish Status: <strong>{status}</strong>
      </div>

      {status === "draft" && (
        <button
          style={buttonStyle}
          onClick={handleSubmitForApproval}
          disabled={isLoading}
        >
          Submit for Approval
        </button>
      )}

      {status === "pending_approval" && (
        <>
          <button
            style={buttonStyle}
            onClick={handleApproveAndSchedule}
            disabled={isLoading}
          >
            Approve & Schedule
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: "#666" }}
            onClick={handlePublishNow}
            disabled={isLoading}
          >
            Approve & Publish Now
          </button>
        </>
      )}

      {status === "scheduled" && (
        <>
          <div style={{ fontSize: "11px", color: "var(--theme-text-secondary)", marginBottom: "8px" }}>
            Scheduled for: <strong>{scheduledFor ? new Date(scheduledFor).toLocaleString() : "—"}</strong>
          </div>
          <button
            style={{ ...buttonStyle, backgroundColor: "#D84630" }}
            onClick={() => setFieldValue("status", "draft")}
            disabled={isLoading}
          >
            Cancel Schedule
          </button>
        </>
      )}

      {status === "published" && (
        <>
          <button
            style={{ ...buttonStyle, backgroundColor: "#666" }}
            onClick={handleUnpublish}
            disabled={isLoading}
          >
            Unpublish
          </button>
          {viewUrl && (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "8px 12px",
                fontSize: "12px",
                textAlign: "center",
                backgroundColor: "var(--theme-elevation-100)",
                color: "var(--theme-text)",
                textDecoration: "none",
                borderRadius: "4px",
                marginTop: "8px",
                transition: "all 0.2s",
              }}
            >
              View on site ↗
            </a>
          )}
        </>
      )}
    </div>
  );
}
