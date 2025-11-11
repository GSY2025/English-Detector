import React, { useEffect, useRef, useState } from "react";
import { ZoeSTT } from "@zoe-ng/stt";

export default function ZoeSTTDemo() {
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const [status, setStatus] = useState("idle");
  const [englishPercent, setEnglishPercent] = useState(null);
  const sttRef = useRef(null);

  useEffect(() => {
    const stt = new ZoeSTT();

    stt.onPartial((t) => setPartial(t));
    stt.onFinal((t) => setFinalText((prev) => (prev ? prev + " " + t : t)));
    stt.onError?.((err) => {
      console.error("STT Error:", err);
      setStatus("error");
    });

    sttRef.current = stt;
    return () => {
      stt.stop();
    };
  }, []);

  const analyzeLanguage = async (text) => {
    if (!text || text.trim().length === 0) {
      setEnglishPercent(0);
      return;
    }
    setStatus("analyzing");
    try {
      const res = await fetch("/api/analyze-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      if (res.ok && typeof j.percent === "number") {
        setEnglishPercent(Math.round(j.percent));
        setStatus("stopped");
      } else {
        console.error("Analyze error", j);
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const startListening = async () => {
    try {
      await sttRef.current.start();
      setStatus("listening");
      setPartial("");
      setFinalText("");
      setEnglishPercent(null);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const stopListening = () => {
    sttRef.current.stop();
    setStatus("stopped");
    // send current finalText for analysis
    const transcript = finalText.trim();
    analyzeLanguage(transcript);
  };

  // --- UI styles ---
  const styles = {
    page: {
      // ensure full-width container and no horizontal padding so flex centering works reliably
      width: "100%",
      padding: "24px 0",              // vertical padding only
      display: "flex",
      justifyContent: "center",      // centers horizontally
      alignItems: "center",          // centers vertically
      background: "#f5f7fb",
      minHeight: "100vh",
      boxSizing: "border-box",
      margin: 0,
      marginLeft: 300,
    },
    card: {
      width: "100%",            // allow card to grow to available width
      maxWidth: 980,            // limit max width for readability
      margin: "0 auto",         // center the card if parent layout changes
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 6px 30px rgba(18, 38, 63, 0.08)",
      padding: 20,
      boxSizing: "border-box",
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#102a43" },
    subtitle: { fontSize: 13, color: "#627d98", marginTop: 6 },
    controls: { display: "flex", gap: 10, alignItems: "center" },
    btn: {
      padding: "8px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
    },
    primary: {
      background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
      color: "#fff",
    },
    ghost: {
      background: "transparent",
      border: "1px solid #dbe7f5",
      color: "#102a43",
    },
    statusBadge: {
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      color: "#fff",
    },
    statusIdle: { background: "#9aa6b2" },
    statusListening: { background: "#16a34a" },
    statusAnalyzing: { background: "#f59e0b" },
    statusError: { background: "#ef4444" },
    grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 16 },
    box: { background: "#fbfdff", borderRadius: 8, padding: 12, minHeight: 120, boxSizing: "border-box" },
    partial: { color: "#6b7280", fontStyle: "italic", minHeight: 48, overflow: "auto" },
    finalText: { whiteSpace: "pre-wrap", color: "#0f172a", minHeight: 100, overflow: "auto" },
    percentBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 },
    circle: { width: 120, height: 120, borderRadius: 999, display: "grid", placeItems: "center", background: "#f1f5f9" },
    progressInner: { fontSize: 22, fontWeight: 700, color: "#0f172a" },
    progressBarWrap: { width: "100%", height: 10, background: "#e6eefb", borderRadius: 999, overflow: "hidden" },
    progressBar: (p) => ({ width: `${p}%`, height: "100%", background: "linear-gradient(90deg,#3b82f6,#06b6d4)" }),
    footerNote: { fontSize: 12, color: "#94a3b8", marginTop: 12 },
  };

  const statusStyle =
    status === "listening" ? { ...styles.statusBadge, ...styles.statusListening } :
    status === "analyzing" ? { ...styles.statusBadge, ...styles.statusAnalyzing } :
    status === "error" ? { ...styles.statusBadge, ...styles.statusError } :
    { ...styles.statusBadge, ...styles.statusIdle };

  const displayPercent = typeof englishPercent === "number" ? englishPercent : 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>English Detector — Demo</h3>
            <div style={styles.subtitle}>Starts listening, stops, and analyzes the transcript to estimate English percentage.</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...statusStyle }}>{status.toUpperCase()}</div>
            <div style={styles.controls}>
              <button
                onClick={startListening}
                disabled={status === "listening"}
                style={{ ...styles.btn, ...styles.primary, opacity: status === "listening" ? 0.6 : 1 }}
              >
                Start
              </button>
              <button
                onClick={stopListening}
                disabled={status !== "listening"}
                style={{ ...styles.btn, ...styles.ghost, opacity: status !== "listening" ? 0.6 : 1 }}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          <div>
            <div style={{ ...styles.box, marginBottom: 12 }}>
              <h4 style={{ margin: "0 0 8px 0" }}>Live (Partial)</h4>
              <div style={styles.partial}>{partial || <span style={{ color: "#cbd5e1" }}>Listening...</span>}</div>
            </div>

            <div style={styles.box}>
              <h4 style={{ margin: "0 0 8px 0" }}>Final Transcript</h4>
              <div style={styles.finalText}>{finalText || <span style={{ color: "#cbd5e1" }}>No transcript yet.</span>}</div>
            </div>

            <div style={styles.footerNote}>
              Tip: Click Stop to analyze the most recent transcript. The backend calls the model to compute the English percent.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...styles.box, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={styles.percentBox}>
                <div style={styles.circle}>
                  <div style={styles.progressInner}>
                    {englishPercent !== null ? `${englishPercent}%` : "—"}
                  </div>
                </div>

                <div style={{ width: "100%" }}>
                  <div style={styles.progressBarWrap}>
                    <div style={styles.progressBar(displayPercent)} />
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
                  {englishPercent !== null ? "Estimated English" : "Awaiting analysis"}
                </div>
              </div>
            </div>

            <div style={{ ...styles.box }}>
              <h4 style={{ margin: "0 0 8px 0" }}>Status Details</h4>
              <div style={{ fontSize: 13, color: "#475569" }}>
                <div><strong>Status:</strong> {status}</div>
                <div><strong>Words:</strong> {finalText ? finalText.trim().split(/\s+/).filter(Boolean).length : 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}