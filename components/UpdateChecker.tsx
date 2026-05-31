"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function UpdateChecker() {
  const [status, setStatus] = useState<"idle" | "checking" | "upToDate" | "updateAvailable">("idle");
  const [updateInfo, setUpdateInfo] = useState<{ current: string; latest: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePopupPosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setStatus("idle");
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
  }, []);

  const checkUpdates = useCallback(async () => {
    if (status === "checking") return;
    setStatus("checking");
    setShowPopup(true);
    updatePopupPosition();

    try {
      // Check GitHub repo's package.json for latest version
      const res = await fetch(
        "https://raw.githubusercontent.com/fxfx4203726-crypto/pi-web-cn/main/package.json",
        { signal: AbortSignal.timeout(8000), cache: "no-store" }
      );
      if (!res.ok) throw new Error("github fetch failed");
      const pkg = await res.json();
      const latestVer = pkg.version;

      const currentVer = "0.1.5";

      if (latestVer && latestVer !== currentVer) {
        setStatus("updateAvailable");
        setUpdateInfo({ current: currentVer, latest: latestVer });
      } else {
        setStatus("upToDate");
        autoHideRef.current = setTimeout(closePopup, 2500);
      }
    } catch {
      setStatus("upToDate");
      autoHideRef.current = setTimeout(closePopup, 2500);
    }
  }, [status, updatePopupPosition, closePopup]);

  const handleUpdate = useCallback(() => {
    closePopup();
    window.open("https://github.com/fxfx4203726-crypto/pi-web-cn/releases/latest", "_blank");
  }, [closePopup]);

  // Close on outside click
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        closePopup();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopup, closePopup]);

  useEffect(() => {
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, []);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={checkUpdates}
        title="检查更新"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 12,
          height: 12,
          padding: 0,
          background: status === "updateAvailable" ? "#ef4444" : status === "checking" ? "#f59e0b" : "#ff5f57",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          boxShadow: status === "updateAvailable" ? "0 0 0 3px rgba(239,68,68,0.2)" : "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.2s, transform 0.15s",
          animation: status === "checking" ? "pulse 1s infinite" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      />
      {showPopup && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 9999,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)",
            minWidth: 260,
            maxWidth: 340,
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--text)",
          }}
        >
          {status === "checking" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 14, height: 14,
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }} />
              <span style={{ color: "var(--text-muted)" }}>正在检查更新…</span>
            </div>
          )}

          {status === "upToDate" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="6" />
                <polyline points="4.5 7 6.5 9 9.5 5" />
              </svg>
              <span style={{ color: "var(--text-muted)" }}>已是最新版</span>
            </div>
          )}

          {status === "updateAvailable" && updateInfo && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>发现新版本</div>
                <div style={{ color: "var(--text-muted)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", background: "var(--bg-panel)", padding: "2px 6px", borderRadius: 4 }}>{updateInfo.current}</span>
                  <span style={{ margin: "0 6px", color: "var(--text-dim)" }}>→</span>
                  <span style={{ fontFamily: "var(--font-mono)", background: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>{updateInfo.latest}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleUpdate}
                  style={{
                    flex: 1,
                    padding: "6px 14px",
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  查看更新
                </button>
                <button
                  onClick={closePopup}
                  style={{
                    padding: "6px 14px",
                    background: "none",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
