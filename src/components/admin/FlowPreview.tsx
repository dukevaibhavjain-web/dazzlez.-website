"use client";

/**
 * FlowPreview — live visual diagram of the chatbot step graph.
 *
 * Rendered as a custom UI field at the top of the ChatbotConfig global
 * admin page. Reads the live form state (steps + entryStepKey) via
 * Payload's useFormFields hook and draws a node-and-arrow overview.
 *
 * No external graph library — plain React + inline styles.
 */

import React, { useEffect, useState } from "react";
import { useFormFields } from "@payloadcms/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepInfo = {
  stepKey: string;
  blockType: string;
  questionText: string;
  options?: Array<{ label: string; goToStepKey: string }>;
  goToStepKey?: string;
};

// ── Colour helpers ────────────────────────────────────────────────────────────

const BG: Record<string, string> = {
  choiceStep:  "#dbeafe",
  describeStep: "#f3e8ff",
  uploadStep:  "#fef3c7",
  results:     "#d1fae5",
  contact:     "#d1fae5",
};

const BORDER: Record<string, string> = {
  choiceStep:  "#93c5fd",
  describeStep: "#c4b5fd",
  uploadStep:  "#fcd34d",
  results:     "#6ee7b7",
  contact:     "#6ee7b7",
};

const KIND_LABEL: Record<string, string> = {
  choiceStep:  "Choice",
  describeStep: "Describe",
  uploadStep:  "Upload",
  results:     "Results",
  contact:     "Contact",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepNode({ stepKey, type, question }: { stepKey: string; type: string; question: string }) {
  return (
    <div style={{
      background: BG[type] ?? "#f1f5f9",
      border:     `2px solid ${BORDER[type] ?? "#cbd5e1"}`,
      borderRadius: 10,
      padding:    "8px 14px",
      minWidth:   110,
      maxWidth:   160,
      textAlign:  "center",
      flexShrink: 0,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{stepKey}</div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
        {KIND_LABEL[type] ?? type}
      </div>
      {question && (
        <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontStyle: "italic" }}>
          {question.length > 28 ? question.slice(0, 28) + "…" : question}
        </div>
      )}
    </div>
  );
}

function TerminalNode({ stepKey }: { stepKey: string }) {
  const isResults = stepKey === "__results__";
  return (
    <div style={{
      background: BG.results,
      border:     `2px solid ${BORDER.results}`,
      borderRadius: 10,
      padding:    "8px 14px",
      minWidth:   90,
      textAlign:  "center",
      flexShrink: 0,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#064e3b" }}>
        {isResults ? "Results" : "Contact"}
      </div>
      <div style={{ fontSize: 10, color: "#059669", marginTop: 1 }}>
        {isResults ? "Product grid" : "Lead form"}
      </div>
    </div>
  );
}

function ArrowSep({ label }: { label?: string }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           0,
      flexShrink:    0,
      minWidth:      28,
    }}>
      {label && (
        <div style={{
          fontSize:      9,
          color:         "#94a3b8",
          maxWidth:      60,
          textAlign:     "center",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
        }}>
          {label}
        </div>
      )}
      <div style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1, marginTop: label ? 0 : 10 }}>→</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const FlowPreview = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Read live form state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepsValue    = useFormFields(([f]) => (f as any)?.steps?.value);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryKeyValue = useFormFields(([f]) => (f as any)?.entryStepKey?.value);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSteps: any[]   = Array.isArray(stepsValue) ? stepsValue : [];
  const entryKey: string  = typeof entryKeyValue === "string" ? entryKeyValue : "occasion";

  if (!mounted) {
    return <div style={{ height: 24 }} />;
  }

  if (!rawSteps.length) {
    return (
      <div style={{
        padding: "12px 16px",
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        marginBottom: 16,
        color: "#94a3b8",
        fontSize: 12,
      }}>
        Add steps below to see the flow preview.
      </div>
    );
  }

  // Build step map
  const stepMap: Record<string, StepInfo> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawSteps.forEach((block: any) => {
    const key = typeof block.stepKey === "string" ? block.stepKey : null;
    if (!key) return;
    stepMap[key] = {
      stepKey:      key,
      blockType:    block.blockType ?? "choiceStep",
      questionText: typeof block.questionText === "string" ? block.questionText : "",
      options:      Array.isArray(block.options)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? block.options.map((o: any) => ({
            label:      typeof o.label      === "string" ? o.label      : "",
            goToStepKey: typeof o.goToStepKey === "string" ? o.goToStepKey : "__results__",
          }))
        : undefined,
      goToStepKey: typeof block.goToStepKey === "string" ? block.goToStepKey : undefined,
    };
  });

  // Collect terminal keys actually referenced
  const terminalKeys = new Set<string>();
  Object.values(stepMap).forEach((s) => {
    const targets = s.options
      ? s.options.map((o) => o.goToStepKey)
      : s.goToStepKey ? [s.goToStepKey] : [];
    targets.forEach((t) => {
      if (t === "__results__" || t === "__contact__") terminalKeys.add(t);
    });
  });

  // Walk from entry to build display order (follow first option only for linear path)
  const ordered: StepInfo[] = [];
  const visited = new Set<string>();
  let cur = entryKey;
  let safety = 0;
  while (cur && stepMap[cur] && !visited.has(cur) && safety < 20) {
    visited.add(cur);
    ordered.push(stepMap[cur]);
    const step = stepMap[cur];
    const firstDest =
      step.options?.[0]?.goToStepKey ?? step.goToStepKey ?? "__results__";
    if (!firstDest || firstDest === "__results__" || firstDest === "__contact__") break;
    cur = firstDest;
    safety++;
  }
  // Append any unvisited steps after the main path
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawSteps.forEach((block: any) => {
    const key = typeof block.stepKey === "string" ? block.stepKey : null;
    if (key && stepMap[key] && !visited.has(key)) {
      ordered.push(stepMap[key]);
    }
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}>
        Flow Preview
      </div>

      {/* Diagram */}
      <div style={{
        overflowX: "auto",
        padding: "12px 0 8px",
        background: "#f8fafc",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        paddingLeft: 12,
        paddingRight: 12,
      }}>
        <div style={{
          display:    "flex",
          alignItems: "flex-start",
          gap:        6,
          minWidth:   "max-content",
        }}>
          {ordered.map((step, i) => (
            <React.Fragment key={step.stepKey}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <StepNode
                  stepKey={step.stepKey}
                  type={step.blockType}
                  question={step.questionText}
                />
                {/* Show branching options */}
                {step.options && step.options.length > 0 && (
                  <div style={{ paddingLeft: 8, paddingTop: 2 }}>
                    {step.options.slice(0, 5).map((o, oi) => (
                      <div key={oi} style={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        3,
                        marginTop:  2,
                        fontSize:   9,
                        color:      "#94a3b8",
                      }}>
                        <span style={{ color: "#cbd5e1" }}>├</span>
                        <span style={{
                          overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", maxWidth: 80,
                        }}>
                          {o.label}
                        </span>
                        <span style={{ color: "#cbd5e1" }}>→</span>
                        <span style={{ color: "#64748b", fontWeight: 700 }}>
                          {o.goToStepKey}
                        </span>
                      </div>
                    ))}
                    {step.options.length > 5 && (
                      <div style={{ fontSize: 9, color: "#cbd5e1", marginTop: 2 }}>
                        +{step.options.length - 5} more
                      </div>
                    )}
                  </div>
                )}
                {/* Describe / Upload goTo hint */}
                {step.goToStepKey && (
                  <div style={{ paddingLeft: 8, fontSize: 9, color: "#94a3b8" }}>
                    → <span style={{ fontWeight: 700, color: "#64748b" }}>{step.goToStepKey}</span>
                  </div>
                )}
              </div>
              {i < ordered.length - 1 && <ArrowSep />}
            </React.Fragment>
          ))}

          {/* Terminal nodes */}
          {[...terminalKeys].map((key) => (
            <React.Fragment key={key}>
              <ArrowSep />
              <TerminalNode stepKey={key} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { type: "choiceStep",  label: "Choice Step" },
          { type: "describeStep", label: "Describe Step" },
          { type: "uploadStep",  label: "Upload Step" },
          { type: "results",     label: "Results (terminal)" },
        ].map(({ type, label }) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#64748b" }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: BG[type], border: `1px solid ${BORDER[type]}`,
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowPreview;
