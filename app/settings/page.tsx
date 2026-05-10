"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  getCustomModels,
  saveCustomModels,
  getAllModels,
  type ModelProvider,
  type ModelType,
  type CustomModel,
  type ModelInputs,
  PROVIDER_COLORS,
} from "@/lib/models";

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

type Tab = "api-keys" | "models";

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

const EMPTY_INPUTS: Partial<ModelInputs> = {
  aspectRatios: [],
  quality: [],
  maxImages: 1,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("api-keys");
  const [keys, setKeys] = useState<ApiKeys>({});
  const [drafts, setDrafts] = useState<ApiKeys>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>({});

  // Custom models state
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [newModel, setNewModel] = useState<{
    id: string;
    name: string;
    provider: ModelProvider;
    type: ModelType;
    inputs: Partial<ModelInputs>;
  }>({
    id: "",
    name: "",
    provider: "openai",
    type: "image",
    inputs: { ...EMPTY_INPUTS },
  });

  useEffect(() => {
    const stored = loadKeys();
    setKeys(stored);
    setDrafts(stored);
    setCustomModels(getCustomModels());
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

  const handleAddCustomModel = useCallback(() => {
    if (!newModel.id.trim() || !newModel.name.trim()) return;
    const updated = [
      ...customModels,
      { ...newModel, id: newModel.id.trim(), name: newModel.name.trim() },
    ];
    saveCustomModels(updated);
    setCustomModels(updated);
    setNewModel({
      id: "",
      name: "",
      provider: "openai",
      type: "image",
      inputs: { ...EMPTY_INPUTS },
    });
    setShowAddModal(false);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  }, [newModel, customModels]);

  const handleDeleteCustomModel = useCallback(
    (id: string) => {
      const updated = customModels.filter((m) => m.id !== id);
      saveCustomModels(updated);
      setCustomModels(updated);
    },
    [customModels]
  );

  const hasChanges = JSON.stringify(keys) !== JSON.stringify(drafts);
  const allModels = getAllModels();

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === "api-keys" ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab("api-keys")}
        >
          API Keys
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === "models" ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab("models")}
        >
          Models
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <>
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
        </>
      )}

      {/* Models Tab */}
      {activeTab === "models" && (
        <>
          <div style={styles.infoBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Built-in models are read-only. Custom models can be added or removed below.
              Custom model IDs can override built-in models.
            </span>
          </div>

          {/* Models Table */}
          <div style={styles.modelsTable}>
            <div style={styles.tableHeader}>
              <span style={{ ...styles.th, flex: 2 }}>Model</span>
              <span style={{ ...styles.th, flex: 1 }}>Provider</span>
              <span style={{ ...styles.th, flex: 1 }}>Type</span>
              <span style={{ ...styles.th, flex: 1 }}>Inputs</span>
              <span style={{ ...styles.th, width: 60 }}></span>
            </div>

            {allModels.map((model) => {
              const isCustom = customModels.some((m) => m.id === model.id);
              return (
                <div
                  key={model.id}
                  style={{
                    ...styles.tableRow,
                    ...(isCustom ? {} : styles.tableRowBuiltin),
                  }}
                >
                  <div style={{ ...styles.td, flex: 2 }}>
                    <div style={styles.modelName}>{model.name}</div>
                    <div style={styles.modelId}>{model.id}</div>
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    <span
                      style={{
                        ...styles.providerBadge,
                        background: `${PROVIDER_COLORS[model.provider]}20`,
                        borderColor: `${PROVIDER_COLORS[model.provider]}40`,
                        color: PROVIDER_COLORS[model.provider],
                      }}
                    >
                      {model.provider}
                    </span>
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    <span style={styles.typeBadge}>{model.type}</span>
                  </div>
                  <div style={{ ...styles.td, flex: 1, fontSize: "0.75rem", color: "#71717a" }}>
                    {model.inputs
                      ? [
                          model.inputs.width && model.inputs.height
                            ? `${model.inputs.width}×${model.inputs.height}`
                            : null,
                          model.inputs.aspectRatios?.length
                            ? `Ratios: ${model.inputs.aspectRatios.length}`
                            : null,
                          model.inputs.quality?.length
                            ? `Quality: ${model.inputs.quality.join(", ")}`
                            : null,
                          model.inputs.maxImages && model.inputs.maxImages !== 1
                            ? `Max: ${model.inputs.maxImages}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      : "—"}
                  </div>
                  <div style={{ ...styles.td, width: 60, justifyContent: "flex-end" }}>
                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomModel(model.id)}
                        style={styles.deleteBtn}
                        title="Delete custom model"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Model Button */}
          <button onClick={() => setShowAddModal(true)} style={styles.addModelBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Custom Model
          </button>

          {/* Add Model Modal */}
          <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Custom Model">
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. My Custom Model"
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Model ID *</label>
                <input
                  type="text"
                  value={newModel.id}
                  onChange={(e) => setNewModel((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="e.g. my-model-v1"
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Provider</label>
                <select
                  value={newModel.provider}
                  onChange={(e) => setNewModel((prev) => ({ ...prev, provider: e.target.value as ModelProvider }))}
                  style={styles.select}
                >
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="replicate">Replicate</option>
                  <option value="muapi">Muapi</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Type</label>
                <select
                  value={newModel.type}
                  onChange={(e) => setNewModel((prev) => ({ ...prev, type: e.target.value as ModelType }))}
                  style={styles.select}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
            </div>

            {/* Inputs Section */}
            <div style={styles.inputsSection}>
              <div style={styles.inputsSectionHeader}>
                <span style={styles.inputsSectionTitle}>Inputs (Optional)</span>
              </div>
              <div style={styles.inputsGrid}>
                <div style={styles.formField}>
                  <label style={styles.label}>Aspect Ratios</label>
                  <input
                    type="text"
                    value={newModel.inputs.aspectRatios?.join(", ") || ""}
                    onChange={(e) =>
                      setNewModel((prev) => ({
                        ...prev,
                        inputs: {
                          ...prev.inputs,
                          aspectRatios: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    placeholder="1:1, 16:9, 9:16"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Width (px)</label>
                  <input
                    type="number"
                    value={newModel.inputs.width || ""}
                    onChange={(e) =>
                      setNewModel((prev) => ({
                        ...prev,
                        inputs: {
                          ...prev.inputs,
                          width: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      } as typeof prev))
                    }
                    placeholder="1024"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Height (px)</label>
                  <input
                    type="number"
                    value={newModel.inputs.height || ""}
                    onChange={(e) =>
                      setNewModel((prev) => ({
                        ...prev,
                        inputs: {
                          ...prev.inputs,
                          height: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      } as typeof prev))
                    }
                    placeholder="1024"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Quality Options</label>
                  <input
                    type="text"
                    value={newModel.inputs.quality?.join(", ") || ""}
                    onChange={(e) =>
                      setNewModel((prev) => ({
                        ...prev,
                        inputs: {
                          ...prev.inputs,
                          quality: e.target.value
                            .split(",")
                            .map((s) => s.trim() as "low" | "standard" | "high")
                            .filter((s) => ["low", "standard", "high"].includes(s)),
                        },
                      }))
                    }
                    placeholder="standard, high"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Max Images</label>
                  <input
                    type="number"
                    value={newModel.inputs.maxImages ?? 1}
                    onChange={(e) =>
                      setNewModel((prev) => ({
                        ...prev,
                        inputs: {
                          ...prev.inputs,
                          maxImages: e.target.value ? parseInt(e.target.value) : 1,
                        },
                      }))
                    }
                    placeholder="1"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={handleAddCustomModel}
                style={{
                  ...styles.saveBtn,
                  ...(!newModel.id.trim() || !newModel.name.trim() ? styles.saveBtnDisabled : {}),
                }}
                disabled={!newModel.id.trim() || !newModel.name.trim()}
              >
                {addSuccess ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Added!
                  </>
                ) : (
                  "Add Model"
                )}
              </button>
            </div>
          </Modal>
        </>
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
    maxWidth: "840px",
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
  tabNav: {
    display: "flex",
    gap: "0.25rem",
    marginBottom: "1.5rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "0.75rem",
    padding: "0.25rem",
  },
  tabBtn: {
    flex: 1,
    padding: "0.625rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#71717a",
    background: "transparent",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  tabBtnActive: {
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
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
  // Models tab styles
  modelsTable: {
    ...glassMixin,
    borderRadius: "0.75rem",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  tableHeader: {
    display: "flex",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "0.75rem 1rem",
  },
  th: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "0.875rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 150ms ease",
  },
  tableRowBuiltin: {
    background: "rgba(0,0,0,0.2)",
  },
  td: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.875rem",
    color: "#e4e4e7",
  },
  modelName: {
    fontWeight: 500,
    color: "#ffffff",
  },
  modelId: {
    fontSize: "0.75rem",
    color: "#52525b",
    fontFamily: "var(--font-mono, monospace)",
    marginTop: "0.125rem",
  },
  providerBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.6875rem",
    fontWeight: 600,
    padding: "0.2rem 0.5rem",
    borderRadius: "999px",
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.6875rem",
    fontWeight: 500,
    color: "#a1a1aa",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "999px",
    padding: "0.2rem 0.5rem",
    textTransform: "uppercase",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.375rem",
    padding: "0.375rem",
    cursor: "pointer",
    color: "#71717a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s, border-color 0.15s",
  },
  addModelBtn: {
    background: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.15)",
    borderRadius: "0.75rem",
    padding: "0.875rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#a1a1aa",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "color 0.15s, border-color 0.15s",
    width: "100%",
  },
  // Form styles for modal
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#a1a1aa",
  },
  select: {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    color: "#ffffff",
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    outline: "none",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "1.25rem",
  },
  // Inputs section in modal
  inputsSection: {
    marginTop: "0.5rem",
    padding: "1rem",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "0.5rem",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  inputsSectionHeader: {
    marginBottom: "0.75rem",
  },
  inputsSectionTitle: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#a1a1aa",
  },
  inputsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
};