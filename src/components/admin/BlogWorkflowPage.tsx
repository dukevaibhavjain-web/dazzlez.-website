"use client";

/**
 * BlogWorkflowPage — 3-column kanban dashboard for blog workflow
 * Columns: Pending Keywords → Drafts → Ready to Publish
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface KeywordBankDoc {
  id: string;
  keyword: string;
  intent: string;
  difficulty: number;
  status: "pending" | "approved" | "used";
}

interface BlogDoc {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "pending_approval" | "scheduled" | "published";
}

export function BlogWorkflowPage() {
  const [keywords, setKeywords] = useState<KeywordBankDoc[]>([]);
  const [drafts, setDrafts] = useState<BlogDoc[]>([]);
  const [readyToPublish, setReadyToPublish] = useState<BlogDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch pending keywords
        const keywordsRes = await fetch("/api/admin/blog/keywords", {
          headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ""}` },
        });
        if (keywordsRes.ok) {
          const { docs } = await keywordsRes.json();
          setKeywords(docs.filter((k: KeywordBankDoc) => k.status === "pending"));
        }

        // Fetch drafts
        const draftsRes = await fetch("/api/admin/blog/drafts", {
          headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ""}` },
        });
        if (draftsRes.ok) {
          const { docs } = await draftsRes.json();
          setDrafts(docs.filter((b: BlogDoc) => b.status === "draft"));
        }

        // Fetch ready to publish (pending_approval + scheduled)
        const readyRes = await fetch("/api/admin/blog/ready", {
          headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ""}` },
        });
        if (readyRes.ok) {
          const { docs } = await readyRes.json();
          setReadyToPublish(
            docs.filter(
              (b: BlogDoc) =>
                b.status === "pending_approval" || b.status === "scheduled"
            )
          );
        }
      } catch (error) {
        console.error("Failed to load workflow data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  const handleApproveKeyword = async (keywordId: string) => {
    try {
      const response = await fetch("/api/admin/blog/approve-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId }),
      });

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
        alert("Keyword approved!");
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const columnStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "var(--theme-elevation-50)",
    borderRadius: "8px",
    padding: "16px",
    minHeight: "600px",
    border: "1px solid var(--theme-elevation-100)",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid var(--theme-elevation-100)",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--theme-text)",
    marginBottom: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    fontSize: "10px",
    padding: "4px 8px",
    borderRadius: "3px",
    backgroundColor: "var(--theme-elevation-100)",
    color: "var(--theme-text)",
    marginRight: "4px",
    marginBottom: "4px",
  };

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading workflow data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          Blog Workflow
        </h1>
        <p style={{ fontSize: "14px", color: "var(--theme-text-secondary)" }}>
          Manage keywords, drafts, and publishing schedule
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            backgroundColor: "#0066CC",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Kanban Columns */}
      <div style={{ display: "flex", gap: "16px" }}>
        {/* Column 1: Pending Keywords */}
        <div style={columnStyle}>
          <div style={titleStyle}>
            ⏳ Keywords to Approve ({keywords.length})
          </div>

          {keywords.length === 0 ? (
            <p
              style={{
                fontSize: "12px",
                color: "var(--theme-text-secondary)",
                textAlign: "center",
                marginTop: "40px",
              }}
            >
              No pending keywords
            </p>
          ) : (
            keywords.map((keyword) => (
              <div key={keyword.id} style={cardStyle}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "var(--theme-text)",
                  }}
                >
                  {keyword.keyword}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <span style={badgeStyle}>{keyword.intent}</span>
                  <span style={badgeStyle}>
                    Difficulty: {keyword.difficulty}/10
                  </span>
                </div>
                <button
                  onClick={() => handleApproveKeyword(keyword.id)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#10B981",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  ✓ Approve
                </button>
              </div>
            ))
          )}
        </div>

        {/* Column 2: Drafts */}
        <div style={columnStyle}>
          <div style={titleStyle}>✍️ Drafts ({drafts.length})</div>

          {drafts.length === 0 ? (
            <p
              style={{
                fontSize: "12px",
                color: "var(--theme-text-secondary)",
                textAlign: "center",
                marginTop: "40px",
              }}
            >
              No draft blogs
            </p>
          ) : (
            drafts.map((blog) => (
              <Link key={blog.id} href={`/admin/collections/blogs/${blog.id}`}>
                <div
                  style={{
                    ...cardStyle,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "var(--theme-text)",
                    }}
                  >
                    {blog.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--theme-text-secondary)",
                    }}
                  >
                    {blog.slug}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Column 3: Ready to Publish */}
        <div style={columnStyle}>
          <div style={titleStyle}>
            📤 Ready to Publish ({readyToPublish.length})
          </div>

          {readyToPublish.length === 0 ? (
            <p
              style={{
                fontSize: "12px",
                color: "var(--theme-text-secondary)",
                textAlign: "center",
                marginTop: "40px",
              }}
            >
              No blogs pending approval or scheduled
            </p>
          ) : (
            readyToPublish.map((blog) => (
              <Link key={blog.id} href={`/admin/collections/blogs/${blog.id}`}>
                <div
                  style={{
                    ...cardStyle,
                    cursor: "pointer",
                    borderLeft: "4px solid #0066CC",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "var(--theme-text)",
                    }}
                  >
                    {blog.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--theme-text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    {blog.slug}
                  </div>
                  <span
                    style={{
                      ...badgeStyle,
                      backgroundColor:
                        blog.status === "pending_approval" ? "#FCD34D" : "#A3E635",
                      color: "#000",
                    }}
                  >
                    {blog.status === "pending_approval"
                      ? "Pending Approval"
                      : "Scheduled"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
