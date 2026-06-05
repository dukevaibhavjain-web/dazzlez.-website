"use client";

/**
 * Analytics Dashboard
 *
 * Real-time metrics from the Events collection:
 * - Funnel analysis (ViewContent → Purchase conversion)
 * - Revenue & orders
 * - Top products
 * - Traffic sources
 * - Blog metrics (when available)
 *
 * Displays at: /admin/analytics
 */

import React, { useEffect, useState } from "react";
import { getPayload } from "payload";
import config from "@payload-config";

interface FunnelMetrics {
  viewContent: number;
  addToCart: number;
  initiateCheckout: number;
  purchase: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  aov: number; // average order value
}

interface MetricCard {
  label: string;
  value: string | number;
  subtext?: string;
  color?: "green" | "blue" | "amber" | "red";
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics>({
    viewContent: 0,
    addToCart: 0,
    initiateCheckout: 0,
    purchase: 0,
  });
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0,
    aov: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/analytics");

      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setFunnelMetrics(data.funnel);
      setRevenueMetrics(data.revenue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Analytics Dashboard</h1>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1>Analytics Dashboard</h1>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={fetchMetrics} style={styles.button}>
          Retry
        </button>
      </div>
    );
  }

  const metricCards: MetricCard[] = [
    {
      label: "Revenue",
      value: `₹${revenueMetrics.totalRevenue.toLocaleString("en-IN")}`,
      subtext: "Last 30 days",
      color: "green",
    },
    {
      label: "Orders",
      value: revenueMetrics.totalOrders,
      subtext: "Last 30 days",
      color: "blue",
    },
    {
      label: "Conversion Rate",
      value: `${(revenueMetrics.conversionRate * 100).toFixed(2)}%`,
      subtext: "ViewContent → Purchase",
      color: "amber",
    },
    {
      label: "Avg. Order Value",
      value: `₹${revenueMetrics.aov.toLocaleString("en-IN")}`,
      subtext: "Per order",
      color: "blue",
    },
  ];

  const conversionRate =
    funnelMetrics.viewContent > 0
      ? (funnelMetrics.purchase / funnelMetrics.viewContent) * 100
      : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Analytics Dashboard</h1>
        <button onClick={fetchMetrics} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div style={styles.cardGrid}>
        {metricCards.map((card) => (
          <div key={card.label} style={{ ...styles.card, borderLeft: `4px solid ${getColorValue(card.color)}` }}>
            <div style={styles.cardLabel}>{card.label}</div>
            <div style={styles.cardValue}>{card.value}</div>
            {card.subtext && <div style={styles.cardSubtext}>{card.subtext}</div>}
          </div>
        ))}
      </div>

      {/* Funnel Analysis */}
      <div style={styles.section}>
        <h2>Conversion Funnel</h2>
        <div style={styles.funnelContainer}>
          <FunnelStep
            label="Page Views"
            count={funnelMetrics.viewContent}
            percentage={100}
          />
          <FunnelStep
            label="Add to Cart"
            count={funnelMetrics.addToCart}
            percentage={
              funnelMetrics.viewContent > 0
                ? (funnelMetrics.addToCart / funnelMetrics.viewContent) * 100
                : 0
            }
          />
          <FunnelStep
            label="Checkout Started"
            count={funnelMetrics.initiateCheckout}
            percentage={
              funnelMetrics.viewContent > 0
                ? (funnelMetrics.initiateCheckout / funnelMetrics.viewContent) * 100
                : 0
            }
          />
          <FunnelStep
            label="Purchase"
            count={funnelMetrics.purchase}
            percentage={conversionRate}
          />
        </div>
      </div>

      {/* Info Message */}
      <div style={styles.info}>
        <p>
          📊 Analytics data is updated in real-time from the Events collection. All events are
          tracked via Google Analytics 4 and Meta Pixel as well.
        </p>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  count,
  percentage,
}: {
  label: string;
  count: number;
  percentage: number;
}) {
  return (
    <div style={styles.funnelStep}>
      <div style={{ ...styles.funnelBar, width: `${Math.max(percentage, 5)}%` }}></div>
      <div style={styles.funnelLabel}>
        <strong>{label}</strong>
        <span style={styles.funnelStats}>
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

function getColorValue(color?: string): string {
  const colors: Record<string, string> = {
    green: "#10b981",
    blue: "#3b82f6",
    amber: "#f59e0b",
    red: "#ef4444",
  };
  return colors[color || "blue"];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  refreshButton: {
    padding: "8px 16px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  card: {
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  cardLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "4px",
  },
  cardSubtext: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  section: {
    marginBottom: "32px",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  funnelContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "16px",
  },
  funnelStep: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  funnelBar: {
    height: "32px",
    background: "linear-gradient(90deg, #3b82f6, #1e40af)",
    borderRadius: "6px",
    minWidth: "20px",
  },
  funnelLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  funnelStats: {
    color: "#6b7280",
    fontSize: "13px",
    marginLeft: "16px",
  },
  error: {
    padding: "16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  button: {
    padding: "10px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  info: {
    padding: "12px 16px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: "6px",
    fontSize: "13px",
    borderLeft: "4px solid #3b82f6",
  },
};
