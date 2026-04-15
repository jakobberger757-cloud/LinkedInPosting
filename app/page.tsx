"use client";

import { useEffect, useState } from "react";
import type { DraftRecord, FullGenerationResponse, HistoryItem } from "@/lib/types";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullGenerationResponse | null>(null);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function loadHistory() {
    const response = await fetch("/api/history");
    const data = await response.json();
    if (response.ok) setHistory(data.history || []);
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate drafts.");
      setResult(data);
      setSelectedAngleId(data.selectedAngleId);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!result?.source?.id || !selectedAngleId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "regenerate_drafts", sourceId: result.source.id, angleId: selectedAngleId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to regenerate drafts.");
      setResult((prev) => prev ? { ...prev, drafts: data.drafts, selectedAngleId } : data);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(draft: DraftRecord, vote: "up" | "down") {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: draft.id, vote })
    });
    await loadHistory();
  }

  return (
    <main>
      <h1>LinkedIn Posting</h1>
      <p className="muted">Paste notes, a URL, or both. The app will summarize the source, generate angles, and draft posts in your voice.</p>

      <div className="card">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste a private markets article URL, raw notes, or both..."
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={handleGenerate} disabled={loading || !input.trim()}>{loading ? "Working..." : "Generate"}</button>
          {result && <button className="secondary" onClick={handleRegenerate} disabled={loading || !selectedAngleId}>Generate drafts for selected angle</button>}
        </div>
        {error && <p style={{ color: "#ff9bb0" }}>{error}</p>}
      </div>

      {result && (
        <>
          <div className="card">
            <div className="row">
              <strong>{result.source.title}</strong>
              <span className="muted small">{result.source.sourceType}</span>
            </div>
            <p>{result.source.summary}</p>
          </div>

          <div className="card">
            <h2>Angles</h2>
            <div className="grid">
              {result.angles.map((angle) => (
                <button
                  key={angle.id}
                  className={`secondary angle ${selectedAngleId === angle.id ? "selected" : ""}`}
                  onClick={() => setSelectedAngleId(angle.id)}
                >
                  <strong>{angle.text}</strong>
                  <div className="small muted" style={{ marginTop: 8 }}>
                    {angle.audienceLens} • {angle.suggestedFormat} • confidence {angle.confidence}/5
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid">
            {result.drafts.map((draft) => (
              <div className="card" key={draft.id}>
                <div className="row">
                  <strong>{draft.label}</strong>
                  <span className={`badge ${draft.evaluation.pass ? "pass" : "fail"}`}>{draft.evaluation.pass ? "PASS" : "FAIL"}</span>
                </div>
                <pre>{draft.text}</pre>
                {draft.evaluation.hardFails.length > 0 && (
                  <>
                    <strong>Hard fails</strong>
                    <ul>{draft.evaluation.hardFails.map((item) => <li key={item}>{item}</li>)}</ul>
                  </>
                )}
                {draft.evaluation.advisories.length > 0 && (
                  <>
                    <strong>Advisories</strong>
                    <ul>{draft.evaluation.advisories.map((item) => <li key={item}>{item}</li>)}</ul>
                  </>
                )}
                <div className="small muted">
                  Stop-scroll {draft.evaluation.scores.stopScroll}/5 • POV {draft.evaluation.scores.pointOfView}/5 • Voice {draft.evaluation.scores.voice}/5 • Specificity {draft.evaluation.scores.specificity}/5 • Discipline {draft.evaluation.scores.discipline}/5
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="secondary" onClick={() => handleVote(draft, "up")}>👍</button>
                  <button className="secondary" onClick={() => handleVote(draft, "down")}>👎</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card">
        <h2>Recent history</h2>
        {history.length === 0 && <p className="muted">No history yet.</p>}
        {history.map((item) => (
          <div key={item.source.id}>
            <strong>{item.source.title}</strong>
            <p className="small muted">{new Date(item.source.createdAt).toLocaleString()}</p>
            <p>{item.source.summary}</p>
            {item.angles.slice(0, 2).map((angle) => (
              <div key={angle.id} style={{ marginBottom: 12 }}>
                <div className="small"><strong>Angle:</strong> {angle.text}</div>
                {angle.drafts.slice(0, 2).map((draft) => (
                  <div className="small muted" key={draft.id} style={{ marginTop: 6 }}>{draft.label}: {draft.text.slice(0, 180)}...</div>
                ))}
              </div>
            ))}
            <hr />
          </div>
        ))}
      </div>
    </main>
  );
}
