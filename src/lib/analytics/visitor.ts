/**
 * Visitor & Session ID Management
 *
 * - visitorId: Anonymous, persistent across sessions (localStorage)
 * - sessionId: Per-session (sessionStorage), expires on tab close
 *
 * Format: dz_<timestamp>_<random> (no PII, GDPR-safe)
 */

const VISITOR_ID_KEY = "_dz_vid";
const SESSION_ID_KEY = "_dz_sid";

/**
 * Get or create a persistent visitor ID (stored in localStorage)
 * Persists across browser sessions
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server-render";

  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = generateId("dz");
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * Get or create a session ID (stored in sessionStorage)
 * Expires when the tab is closed
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server-render";

  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateId("session");
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

/**
 * Generate ID in format: prefix_<timestamp>_<random>
 * Example: dz_1716134400000_a1b2c3d4
 */
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Clear visitor ID (for testing or opt-out)
 */
export function clearVisitorId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VISITOR_ID_KEY);
}

/**
 * Clear session ID (for testing)
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Get anonymized IP from request headers
 * Redacts last octet for GDPR compliance
 */
export function anonymizeIp(ip?: string): string {
  if (!ip) return "unknown";
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0"; // redact last octet
    return parts.join(".");
  }
  return ip;
}

/**
 * Extract UTM parameters from URL
 */
export function getUtmParams(): {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
} {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    content: params.get("utm_content") || undefined,
  };
}
