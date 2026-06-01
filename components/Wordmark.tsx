"use client"

export function Wordmark({ back, onBack }: { back?: boolean; onBack?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {back && (
        <button onClick={onBack} aria-label="Go back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 2 }}>
        Fork
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#FF5C35", marginBottom: 3 }} />
      </div>
    </div>
  )
}
