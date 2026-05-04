"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "uas_api_keys";

interface ApiKeys {
  openai?: string;
  google?: string;
  replicate?: string;
  muapi?: string;
}

const PROVIDERS = [
  {
    id: "openai" as const,
    label: "OpenAI",
    sublabel: "GPT-Image, DALL-E",
    placeholder: "sk-...",
    mask: "sk-••••••••••••••••",
    formatValid: (v: string) => v.startsWith("sk-") && v.length > 20,
  },
  {
    id: "google" as const,
    label: "Google",
    sublabel: "Vertex AI / Imagen",
    placeholder: "ya29....",
    mask: "ya29••••••••••••••••",
    formatValid: (v: string) => v.length > 30,
  },
  {
    id: "replicate" as const,
    label: "Replicate",
    sublabel: "Flux, Stable Diffusion",
    placeholder: "r8_...",
    mask: "r8_••••••••••••••••",
    formatValid: (v: string) => v.startsWith("r8_") && v.length > 10,
  },
  {
    id: "muapi" as const,
    label: "Muapi",
    sublabel: "Muapi.ai gateway",
    placeholder: "mk-...",
    mask: "mk-••••••••••••••••",
    formatValid: (v: string) => v.startsWith("mk-") && v.length > 10,
  },
];

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length < 8) return "••••••••";
  return key.slice(0, 4) + "••••••••••••••••";
}

function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

type TestStatus = Record<string, "idle" | "valid" | "invalid">;

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [drafts, setDrafts] = useState<ApiKeys>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>({});

  useEffect(() => {
    const stored = loadKeys();
    setKeys(stored);
    setDrafts(stored);
  }, []);

  const handleSave = useCallback(() => {
    saveKeys(drafts);
    setKeys(drafts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [drafts]);

  const handleClearAll = useCallback(() => {
    const empty: ApiKeys = {};
    saveKeys(empty);
    setKeys(empty);
    setDrafts(empty);
    setShowClearConfirm(false);
  }, []);

  const handleTest = useCallback(
    (providerId: string) => {
      const value = drafts[providerId as keyof ApiKeys] || "";
      if (!value.trim()) {
        setTestStatus((s) => ({ ...s, [providerId]: "invalid" }));
        return;
      }
      const provider = PROVIDERS.find((p) => p.id === providerId);
      if (provider && provider.formatValid(value)) {
        setTestStatus((s) => ({ ...s, [providerId]: "valid" }));
      } else {
        setTestStatus((s) => ({ ...s, [providerId]: "invalid" }));
      }
    },
    [drafts]
  );

  const handleChange = (providerId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [providerId]: value }));
    setTestStatus((s) => ({ ...s, [providerId]: "idle" }));
  };

  const hasChanges = JSON.stringify(keys) !== JSON.stringify(drafts);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSubtitle}>Manage your API keys for each provider.</p>
      </div>

      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          API keys are stored locally in your browser and never sent to our servers.
          All generation requests are made directly to the providers.
        </span>
      </div>

      {/* Provider Cards */}
      <div style={styles.cards}>
        {PROVIDERS.map((provider) => {
          const savedValue = keys[provider.id] || "";
          const draftValue = drafts[provider.id] || "";
          const isSaved = savedValue.length > 0;
          const status = testStatus[provider.id] || "idle";

          return (
            <div key={provider.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.providerName}>{provider.label}</div>
                  <div style={styles.providerSub}>{provider.sublabel}</div>
                </div>
                {isSaved && (
                  <span style={styles.savedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </span>
                )}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="password"
                  value={draftValue}
                  onChange={(e) => handleChange(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                  style={styles.input}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={() => handleTest(provider.id)}
                  style={{
                    ...styles.testBtn,
                    ...(status === "valid"
                      ? { color: "#22c55e", borderColor: "#22c55e" }
                      : status === "invalid"
                      ? { color: "#ef4444", borderColor: "#ef4444" }
                      : {}),
                  }}
                  disabled={!draftValue}
                  title="Validate key format"
                >
                  {status === "valid" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : status === "invalid" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  )}
                </button>
              </div>

              {isSaved && draftValue === savedValue && draftValue.length > 0 && (
                <div style={styles.maskedPreview}>
                  Currently saved: <code style={styles.maskedCode}>{maskKey(savedValue)}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        {hasChanges && (
          <span style={styles.unsavedHint}>You have unsaved changes</span>
        )}

        <button
          onClick={() => setShowClearConfirm(true)}
          style={styles.clearBtn}
          disabled={!Object.values(keys).some(Boolean)}
        >
          Clear All Keys
        </button>

        <button
          onClick={handleSave}
          style={{ ...styles.saveBtn, ...(hasChanges ? {} : styles.saveBtnDisabled) }}
          disabled={!hasChanges}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div style={styles.overlay} onClick={() => setShowClearConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Clear all API keys?</h2>
            <p style={styles.modalBody}>
              This will remove all stored API keys from this browser. You will need to re-enter them to use generation features.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowClearConfirm(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleClearAll} style={styles.dangerBtn}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const glassMixin = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#050505",
    color: "#ffffff",
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    padding: "2rem 1.5rem",
    maxWidth: "720px",
    margin: "0 auto",
  },
  pageHeader: {
    marginBottom: "1.5rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#ffffff",
    margin: "0 0 0.25rem 0",
  },
  pageSubtitle: {
    fontSize: "0.875rem",
    color: "#a1a1aa",
    margin: 0,
  },
  infoBanner: {
    ...glassMixin,
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    color: "#a1a1aa",
    marginBottom: "1.5rem",
    lineHeight: 1.5,
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  card: {
    ...glassMixin,
    borderRadius: "0.75rem",
    padding: "1.25rem",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "0.875rem",
  },
  providerName: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  providerSub: {
    fontSize: "0.75rem",
    color: "#52525b",
    marginTop: "0.125rem",
  },
  savedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.6875rem",
    fontWeight: 500,
    color: "#22c55e",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "999px",
    padding: "0.125rem 0.5rem",
  },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  input: {
    flex: 1,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    color: "#ffffff",
    fontFamily: "var(--font-mono, monospace)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  testBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "0.5rem",
    padding: "0.5rem",
    cursor: "pointer",
    color: "#52525b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s, border-color 0.15s",
    flexShrink: 0,
  },
  maskedPreview: {
    marginTop: "0.5rem",
    fontSize: "0.75rem",
    color: "#52525b",
  },
  maskedCode: {
    fontFamily: "var(--font-mono, monospace)",
    color: "#3f3f46",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.75rem",
    paddingTop: "0.5rem",
  },
  unsavedHint: {
    fontSize: "0.75rem",
    color: "#f59e0b",
    marginRight: "auto",
  },
  saveBtn: {
    background: "#d9ff00",
    color: "#000000",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.5rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    transition: "opacity 0.15s, box-shadow 0.15s",
    boxShadow: "0 0 0 0 rgba(217,255,0,0)",
  },
  saveBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  clearBtn: {
    background: "transparent",
    color: "#a1a1aa",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "color 0.15s, border-color 0.15s",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  modal: {
    ...glassMixin,
    background: "#0a0a0a",
    borderRadius: "1rem",
    padding: "1.5rem",
    maxWidth: "400px",
    width: "90%",
  },
  modalTitle: {
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 0.75rem 0",
  },
  modalBody: {
    fontSize: "0.875rem",
    color: "#a1a1aa",
    lineHeight: 1.6,
    margin: "0 0 1.25rem 0",
  },
  modalActions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.05)",
    color: "#a1a1aa",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  dangerBtn: {
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
