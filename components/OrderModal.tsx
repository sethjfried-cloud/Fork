"use client"

import { useState } from "react"
import type { Restaurant } from "@/lib/types"
import { DELIVERY_APPS, RESERVATION_APPS } from "@/lib/constants"

type Props = {
  restaurant: Restaurant
  onClose: () => void
  onOrderClick: (restaurant: Restaurant) => void
}

export function OrderModal({ restaurant, onClose, onOrderClick }: Props) {
  const [showReservations, setShowReservations] = useState(false)

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ background: "#141414", borderRadius: "24px 24px 0 0", padding: "24px 24px 36px", width: "100%", maxWidth: 390, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FF5C35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>
            {restaurant.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{restaurant.name}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{restaurant.categories} · {restaurant.price}</div>
          </div>
        </div>

        {/* Toggle between delivery and reservations */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setShowReservations(false)}
            style={{
              flex: 1,
              background: !showReservations ? "#FF5C35" : "#1A1A1A",
              border: "none",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              fontWeight: 600,
              color: !showReservations ? "#fff" : "#666",
              cursor: "pointer",
              transition: "all .15s",
            }}>
            Order Delivery
          </button>
          <button
            onClick={() => setShowReservations(true)}
            style={{
              flex: 1,
              background: showReservations ? "#7F77DD" : "#1A1A1A",
              border: "none",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              fontWeight: 600,
              color: showReservations ? "#fff" : "#666",
              cursor: "pointer",
              transition: "all .15s",
            }}>
            Make Reservation
          </button>
        </div>

        {!showReservations ? (
          <>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Choose delivery app:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DELIVERY_APPS.map(app => (
                <a
                  key={app.name}
                  href={app.getUrl(restaurant.name, restaurant.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOrderClick(restaurant)}
                  className="delivery-app"
                  style={{ display: "flex", alignItems: "center", gap: 14, background: app.color, borderRadius: 14, padding: "14px 16px", textDecoration: "none", transition: "all .15s" }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: app.textColor || "#fff" }}>
                    {app.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: app.textColor || "#fff" }}>{app.name}</span>
                      {app.isCheapest && (
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,.3)", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: app.textColor || "#fff" }}>BEST VALUE</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{app.priceHint}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke={app.textColor || "#fff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Not all restaurants take online bookings — check below or call ahead:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RESERVATION_APPS.map(app => (
                <a
                  key={app.name}
                  href={app.getUrl(restaurant.name, restaurant.address, restaurant.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOrderClick(restaurant)}
                  className="delivery-app"
                  style={{ display: "flex", alignItems: "center", gap: 14, background: app.color, borderRadius: 14, padding: "14px 16px", textDecoration: "none", transition: "all .15s" }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                    {app.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>{app.hint}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{ width: "100%", background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "14px", marginTop: 16, color: "#666", fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
