"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import AppNav from "@/components/AppNav";

// ─── Status / Payment badges ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#fefce8", color: "#854d0e", border: "#fde68a", label: "Pending" },
    accepted: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Accepted" },
    rejected: { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca", label: "Rejected" },
    completed: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", label: "Completed" },
    cancelled: { bg: "#fafafa", color: "#4b5563", border: "#e5e5e5", label: "Cancelled" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20
    }}>
      {s.label}
    </span>
  );
}

// ─── Time Picker ─────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(10);
  const [m, setM] = useState(0);
  const [ampm, setAmpm] = useState("AM");
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function adjH(d) { setH((prev) => ((prev - 1 + d + 12) % 12) + 1); }
  function adjM(d) { setM((prev) => (prev + d + 60) % 60); }

  function confirm() {
    const txt = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    onChange(txt);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 13px", border: "1px solid #fecaca", borderRadius: 10,
          background: "#fef2f2", cursor: "pointer", fontSize: 13,
          color: value ? "#111" : "#aaa"
        }}
      >
        <span>{value || "Select time"}</span>
        <span style={{ color: "#b91c1c" }}>🕐</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30,
          background: "#fff", border: "1px solid #fecaca", borderRadius: 12,
          padding: 16, boxShadow: "0 8px 32px rgba(185,28,28,0.12)", width: 240
        }}>
          {/* Wheels */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
            {/* Hour */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button onClick={() => adjH(1)} style={wheelBtn}>▲</button>
              <div style={wheelVal}>{String(h).padStart(2, "0")}</div>
              <button onClick={() => adjH(-1)} style={wheelBtn}>▼</button>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>:</span>
            {/* Minute */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button onClick={() => adjM(15)} style={wheelBtn}>▲</button>
              <div style={wheelVal}>{String(m).padStart(2, "0")}</div>
              <button onClick={() => adjM(-15)} style={wheelBtn}>▼</button>
            </div>
            {/* AM/PM */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: 6 }}>
              {["AM", "PM"].map((p) => (
                <button key={p} onClick={() => setAmpm(p)}
                  style={{
                    padding: "6px 10px", border: "1px solid #fecaca", borderRadius: 6,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: ampm === p ? "#7f1d1d" : "#fef2f2",
                    color: ampm === p ? "#fff" : "#888"
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button onClick={confirm}
            style={{
              width: "100%", padding: 8, background: "#7f1d1d", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>
            Confirm Time
          </button>
        </div>
      )}
    </div>
  );
}
const wheelBtn = { background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontSize: 16, padding: "2px 8px", lineHeight: 1 };
const wheelVal = { fontSize: 28, fontWeight: 800, color: "#111", minWidth: 44, textAlign: "center", letterSpacing: "-0.03em" };

// ─── Coupon system ────────────────────────────────────────────────────────────
const COUPONS = [
  { code: "CLEAN20", desc: "20% off on all services", pct: 20 },
  { code: "FIRST15", desc: "15% off for first booking", pct: 15 },
  { code: "SAVE200", desc: "Flat ₹200 off", flat: 200 },
];

// ─── Day chip ────────────────────────────────────────────────────────────────
function DayChip({ day, active, onToggle }) {
  return (
    <span onClick={onToggle}
      style={{
        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        cursor: "pointer", border: "1px solid", transition: "all 0.15s",
        background: active ? "#7f1d1d" : "#fff",
        color: active ? "#fff" : "#888",
        borderColor: active ? "#7f1d1d" : "#fecaca"
      }}>
      {day}
    </span>
  );
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Summary row ─────────────────────────────────────────────────────────────
function SumRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
      <span style={{ color: highlight ? "#15803d" : "#888" }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight ? "#15803d" : "#111" }}>{value}</span>
    </div>
  );
}

// ─── Mock payment modal ───────────────────────────────────────────────────────
function MockPaymentModal({ booking, total, onSuccess, onFailure, onCancel }) {
  const [step, setStep] = useState("confirm");

  async function handlePay(simulateFailure) {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const res = await fetch("/api/payment/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id, simulateFailure }),
      });
      const data = await res.json();
      if (data.success) { setStep("done"); setTimeout(() => onSuccess(data), 1200); }
      else { setStep("failed"); setTimeout(() => onFailure(data.message), 1200); }
    } catch {
      setStep("failed"); setTimeout(() => onFailure("Something went wrong."), 1200);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 50, padding: 20
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #fecaca",
        width: "100%", maxWidth: 400, padding: 32, textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
      }}>

        {step === "confirm" && (
          <>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(185,28,28,0.08)", borderRadius: 999, padding: "4px 14px",
              marginBottom: 20, fontSize: 11, fontWeight: 700, color: "#b91c1c",
              textTransform: "uppercase", letterSpacing: "0.06em"
            }}>
              🧪 Sandbox / Test Mode
            </div>
            <p style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 4 }}>Complete Payment</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              Simulated payment — no real money charged.
            </p>
            <div style={{ background: "#fef2f2", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Total Amount</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "#b91c1c" }}>₹{total}</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                Booking #{String(booking._id).slice(-6).toUpperCase()}
              </p>
            </div>
            <div style={{
              border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px",
              marginBottom: 20, display: "flex", alignItems: "center", gap: 12, textAlign: "left"
            }}>
              <div style={{
                width: 40, height: 28, borderRadius: 4,
                background: "linear-gradient(135deg,#b91c1c,#dc143c)", flexShrink: 0
              }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>•••• •••• •••• 4242</p>
                <p style={{ fontSize: 11, color: "#888" }}>Test Card — expires 12/99</p>
              </div>
            </div>
            <button onClick={() => handlePay(false)}
              style={{
                width: "100%", padding: "11px", background: "#7f1d1d", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: "pointer", marginBottom: 8
              }}>
              Pay ₹{total}
            </button>
            <button onClick={() => handlePay(true)}
              style={{
                width: "100%", padding: "10px", border: "1px solid #fecaca",
                borderRadius: 10, background: "#fef2f2", color: "#b91c1c",
                fontWeight: 600, cursor: "pointer", fontSize: 13, marginBottom: 8
              }}>
              Simulate Failure
            </button>
            <button onClick={onCancel}
              style={{
                width: "100%", padding: "10px", border: "1px solid #e5e5e5",
                borderRadius: 10, background: "#fff", color: "#555",
                fontWeight: 600, cursor: "pointer", fontSize: 13
              }}>
              Cancel
            </button>
          </>
        )}

        {step === "processing" && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "4px solid #fecaca", borderTop: "4px solid #b91c1c",
              animation: "spin 0.8s linear infinite", margin: "0 auto 20px"
            }} />
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Processing…</p>
            <p style={{ fontSize: 13, color: "#888" }}>Please wait, do not close this window.</p>
          </>
        )}

        {step === "done" && (
          <>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 30
            }}>✅</div>
            <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#15803d" }}>Payment Successful!</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Redirecting you now…</p>
          </>
        )}

        {step === "failed" && (
          <>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", background: "#fff1f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 30
            }}>❌</div>
            <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#b91c1c" }}>Payment Failed</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Closing in a moment…</p>
          </>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

// ─── Location Picker Component ────────────────────────────────────────────────
function LocationPicker({ location, lat, lng, onChange }) {
  const [showMap, setShowMap] = useState(false);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!showMap) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    async function initMap() {
      try {
        if (!window.L) {
          const cssLink = document.createElement("link");
          cssLink.rel = "stylesheet";
          cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(cssLink);

          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => initMapInstance();
          document.body.appendChild(script);
        } else {
          initMapInstance();
        }
      } catch (err) {
        console.error("Failed to load map:", err);
      }
    }

    function initMapInstance() {
      if (!mapElRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const L = window.L;
      const defaultLat = lat || 19.076;
      const defaultLng = lng || 72.8777;
      const map = L.map(mapElRef.current).setView([defaultLat, defaultLng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      let marker = null;
      if (lat && lng) {
        marker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup("Selected location")
          .openPopup();
      }

      map.on("click", (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        onChange({
          lat: Number(newLat.toFixed(6)),
          lng: Number(newLng.toFixed(6)),
        });

        if (marker) map.removeLayer(marker);
        marker = L.marker([newLat, newLng])
          .addTo(map)
          .bindPopup("Selected location")
          .openPopup();
      });
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, lat, lng]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter address or location description"
          value={location}
          onChange={(e) => onChange({ location: e.target.value })}
          style={{
            width: "100%",
            padding: "10px 13px",
            border: "1px solid #fecaca",
            borderRadius: 10,
            fontSize: 13,
            color: "#111",
            background: "#fef2f2",
            outline: "none",
            marginBottom: 8
          }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1,
            background: "#f9f9f9",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #e5e5e5",
            fontSize: 12,
            color: "#555"
          }}>
            {lat && lng ? `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}` : "No coordinates set"}
          </div>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            style={{
              padding: "8px 16px",
              background: "#0369a1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            {showMap ? "Hide Map" : "Set on Map"}
          </button>
        </div>
      </div>

      {showMap && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #fecaca",
            width: "100%",
            maxWidth: 700,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 22px",
              borderBottom: "1px solid #fef2f2",
              borderLeft: "4px solid #0369a1"
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 3px" }}>
                📍 Set Service Location
              </h3>
              <p style={{ fontSize: 13, color: "#888" }}>
                Click on the map to select where you want the service performed
              </p>
            </div>
            <div style={{
              flex: 1,
              overflow: "hidden",
              minHeight: 400
            }}>
              <div id="location-map" ref={mapElRef} style={{
                width: "100%",
                height: "100%",
                minHeight: 400
              }}></div>
            </div>
            <div style={{
              padding: "14px 22px",
              borderTop: "1px solid #fef2f2",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8
            }}>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");
  const serviceIdFromQuery = searchParams.get("serviceId");

  const [provider, setProvider] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
  const [meData, setMeData] = useState(null);
  const [form, setForm] = useState({
    serviceId: "", scheduledDate: "", timeSlot: "", type: "one-time",
    contractMonths: 3, contractDays: 3, selectedDays: ["Mon", "Wed", "Fri"],
    notes: "", advanceOnly: false,
    location: "", lat: null, lng: null, useProfileLocation: true,
  });
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasBookingDetailsChanged = useMemo(() => {
    if (!createdBooking) return false;
    const bookingDate = createdBooking.scheduledDate
      ? new Date(createdBooking.scheduledDate).toISOString().split("T")[0]
      : "";
    return (
      String(form.serviceId) !== String(createdBooking.serviceId) ||
      form.type !== createdBooking.type ||
      form.scheduledDate !== bookingDate ||
      form.timeSlot !== (createdBooking.timeSlot || "") ||
      form.notes !== (createdBooking.notes || "") ||
      form.location !== (createdBooking.location || "") ||
      form.lat !== createdBooking.lat ||
      form.lng !== createdBooking.lng
    );
  }, [createdBooking, form]);

  const isFormComplete = useMemo(() => {
    if (!form.serviceId || !form.scheduledDate || !form.timeSlot) return false;
    if (form.type === "contract") {
      if (!form.contractMonths || form.contractMonths < 1) return false;
      if (!form.contractDays || form.contractDays < 1) return false;
      if (!form.selectedDays || !form.selectedDays.length) return false;
    }
    // Check location
    if (form.useProfileLocation) {
      if (!meData?.user?.lat || !meData?.user?.lng) return false;
    } else {
      if (!form.lat || !form.lng) return false;
    }
    return true;
  }, [form, meData]);

  const isRequestButtonDisabled = submitting || !isFormComplete || (createdBooking && !hasBookingDetailsChanged);

  useEffect(() => {
    async function load() {
      try {
        if (!providerId) throw new Error("Provider is required.");
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        if (!meRes.ok) {
          router.push(`/sign-in?redirect_url=${encodeURIComponent(`/book?providerId=${providerId}`)}`);
          return;
        }
        if (meData.user?.role !== "user") throw new Error("Only user accounts can create bookings.");
        setCurrentRole(meData.user?.role || "");
        setMeData(meData);
        const provRes = await fetch(`/api/providers/${providerId}`);
        const provData = await provRes.json();
        if (!provRes.ok) throw new Error(provData.error || "Failed to load provider");
        setProvider(provData);
        // Set serviceId from query parameter or use first service
        const selectedServiceId = serviceIdFromQuery || provData.services?.[0]?._id;
        if (selectedServiceId) setForm((f) => ({ ...f, serviceId: selectedServiceId }));
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [providerId, serviceIdFromQuery, router]);

  const serviceOptions = useMemo(() => provider?.services || [], [provider]);
  const selectedService = useMemo(() =>
    serviceOptions.find((s) => s._id === form.serviceId) || serviceOptions[0],
    [serviceOptions, form.serviceId]);

  const basePrice = Number(selectedService?.price || provider?.basePrice || 0);
  const bookingCharge = Number(provider?.bookingCharge || 50);
  const serviceFee = Number(provider?.serviceFee || 30);

  const totalVisits = useMemo(() => {
    if (form.type !== "contract") return 1;
    return form.contractMonths * 4 * form.contractDays;
  }, [form.type, form.contractMonths, form.contractDays]);

  const baseTotal = basePrice * totalVisits;
  const fees = bookingCharge + serviceFee;
  const subtotal = baseTotal + fees;

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.pct) return Math.round(baseTotal * appliedCoupon.pct / 100);
    if (appliedCoupon.flat) return appliedCoupon.flat;
    return 0;
  }, [appliedCoupon, baseTotal]);

  const totalPayable = subtotal - discount;
  const advanceAmount = Math.round(totalPayable * 0.3);
  const showCoupons = subtotal > 1500;

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      selectedDays: f.selectedDays.includes(day)
        ? f.selectedDays.filter((d) => d !== day)
        : [...f.selectedDays, day],
    }));
  }

  async function createBooking() {
    setError("");
    setCreatedBooking(null);
    setPaymentDone(false);
    setSubmitting(true);
    try {
      if (currentRole !== "user") throw new Error("Only user accounts can create bookings.");

      // Determine location data
      let locationData = {};
      if (form.useProfileLocation) {
        // Use profile location
        locationData = {
          location: meData?.user?.location || "",
          lat: meData?.user?.lat || null,
          lng: meData?.user?.lng || null,
        };
      } else {
        // Use custom location
        locationData = {
          location: form.location,
          lat: form.lat,
          lng: form.lng,
        };
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: form.serviceId,
          scheduledDate: form.scheduledDate,
          timeSlot: form.timeSlot,
          type: form.type,
          contractMonths: form.type === "contract" ? form.contractMonths : undefined,
          contractDaysPerWeek: form.type === "contract" ? form.contractDays : undefined,
          preferredDays: form.type === "contract" ? form.selectedDays : undefined,
          notes: form.notes,
          couponCode: appliedCoupon?.code,
          amount: form.advanceOnly ? advanceAmount : totalPayable,
          ...locationData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");
      setCreatedBooking(data);
      setShowConfirmModal(false);
      setShowPayModal(false);
      setPaymentDone(false);
      setInfo("Service request created. Payment will be enabled once the provider approves your booking.");
      setError("");
    } catch (err) {
      setCreatedBooking(null);
      setInfo("");
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cs = {
    background: "#fff", border: "1px solid #fecaca", borderRadius: 16,
    padding: "24px", boxShadow: "0 4px 24px rgba(185,28,28,0.05)"
  };

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
    color: "#b91c1c", marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
  };

  const fieldLabel = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" };

  const inputStyle = {
    width: "100%", padding: "10px 13px", border: "1px solid #fecaca",
    borderRadius: 10, fontSize: 13, color: "#111", background: "#fef2f2", outline: "none",
    fontFamily: "inherit"
  };

  return (
    <>
      <style>{`
        .bk-page { min-height:100vh; background:#fef2f2; }
        .bk-shell { max-width:960px; margin:0 auto; padding:32px 16px 64px; }
        .bk-layout { display:grid; grid-template-columns:1.6fr 1fr; gap:16px; align-items:start; }
        @media(max-width:680px) { .bk-layout { grid-template-columns:1fr; } }
        .bk-type-toggle { display:grid; grid-template-columns:1fr 1fr; border:1px solid #fecaca; border-radius:10px; overflow:hidden; }
        .bk-type-btn { padding:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:#fff; color:#888; transition:all 0.15s; font-family:inherit; }
        .bk-type-btn.active { background:#7f1d1d; color:#fff; }
        .bk-type-btn:first-child { border-right:1px solid #fecaca; }
        .bk-submit { width:100%; padding:13px; background:#7f1d1d; color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; transition:background 0.15s,transform 0.1s; font-family:inherit; box-shadow:0 4px 16px rgba(127,29,29,0.22); }
        .bk-submit:hover:not(:disabled) { background:#991b1b; transform:translateY(-1px); }
        .bk-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .bk-coupon-item { display:flex; align-items:center; justify-content:space-between; padding:9px 13px; border:1px solid #fecaca; border-radius:9px; background:#fef2f2; cursor:pointer; transition:all 0.15s; margin-bottom:6px; }
        .bk-coupon-item:hover { border-color:#b91c1c; background:#fff1f2; }
        .bk-coupon-item.applied { border-color:#15803d; background:#f0fdf4; }
        /* Confirm modal */
        .bk-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:100; padding:16px; }
        .bk-modal { background:#fff; border-radius:16px; border:1px solid #fecaca; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,0.15); animation:bkUp 0.25s ease; overflow:hidden; }
        @keyframes bkUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .bk-modal-head { padding:20px 24px; border-bottom:1px solid #fef2f2; border-left:4px solid #b91c1c; }
        .bk-modal-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #fef2f2; font-size:13px; }
        .bk-modal-row:last-child { border-bottom:none; }
        .bk-adv-toggle { display:grid; grid-template-columns:1fr 1fr; border:1px solid #fecaca; border-radius:9px; overflow:hidden; margin:10px 0; }
        .bk-adv-btn { padding:9px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:#fef2f2; color:#888; transition:all 0.15s; font-family:inherit; }
        .bk-adv-btn.active { background:#7f1d1d; color:#fff; }
        .bk-adv-btn:first-child { border-right:1px solid #fecaca; }
        .bk-sel { width:100%; padding:10px 32px 10px 13px; border:1px solid #fecaca; border-radius:10px; font-size:13px; color:#111; background:#fef2f2; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; font-family:inherit; }
      `}</style>

      <main className="bk-page">
        <AppNav />
        <div className="bk-shell">

          {/* Header */}
          <div style={{
            background: "#fff", border: "1px solid #fecaca", borderLeft: "4px solid #b91c1c",
            borderRadius: 16, padding: "22px 28px", marginBottom: 20,
            boxShadow: "0 4px 24px rgba(185,28,28,0.06)"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b91c1c", marginBottom: 4 }}>User</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em", margin: "0 0 3px" }}>Book a Service</h1>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Review details, select timing, and confirm your booking.</p>
            {info && (
              <div style={{
                marginTop: 12, padding: "10px 14px", background: "#ecfdf5",
                border: "1px solid #bbf7d0", borderRadius: 10, color: "#065f46", fontSize: 13
              }}>
                {info}
              </div>
            )}
            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fecaca", borderRadius: 10, color: "#b91c1c", fontSize: 13
              }}>
                {error}
              </div>
            )}
          </div>

          {provider ? (
            <div className="bk-layout">

              {/* ── Left: Form ── */}
              <div style={cs}>

                {/* Provider pill */}
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                  padding: "12px 16px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 20
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{provider.businessName}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>📍 {provider.location || "Unknown location"}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, background: "#f0fdf4", color: "#15803d",
                    border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px"
                  }}>
                    Approved ✓
                  </span>
                </div>

                {/* ── Service ── */}
                <div style={{ ...sectionLabel }}>
                  Service Details
                  <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={fieldLabel}>Select Service</label>
                  <select className="bk-sel"
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
                    {serviceOptions.map((s) => (
                      <option key={s._id} value={s._id}>{s.title} — ₹{s.price}</option>
                    ))}
                  </select>
                </div>

                {/* Type toggle */}
                <div style={{ marginBottom: 14 }}>
                  <label style={fieldLabel}>Booking Type</label>
                  <div className="bk-type-toggle">
                    <button className={`bk-type-btn ${form.type === "one-time" ? "active" : ""}`}
                      type="button" onClick={() => setForm({ ...form, type: "one-time" })}>
                      One-time
                    </button>
                    <button className={`bk-type-btn ${form.type === "contract" ? "active" : ""}`}
                      type="button" onClick={() => setForm({ ...form, type: "contract" })}>
                      Contract-based
                    </button>
                  </div>
                </div>

                {/* Contract extras */}
                {form.type === "contract" && (
                  <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 10, padding: 14, marginBottom: 14
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#b91c1c",
                      letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10
                    }}>
                      Contract Details
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={fieldLabel}>Duration (months)</label>
                        <input style={inputStyle} type="number" min={1} max={24}
                          value={form.contractMonths}
                          onChange={(e) => setForm({ ...form, contractMonths: +e.target.value })} />
                      </div>
                      <div>
                        <label style={fieldLabel}>Days per week</label>
                        <select className="bk-sel"
                          value={form.contractDays}
                          onChange={(e) => setForm({ ...form, contractDays: +e.target.value })}>
                          <option value={1}>1 day/week</option>
                          <option value={2}>2 days/week</option>
                          <option value={3}>3 days/week</option>
                          <option value={5}>5 days/week</option>
                          <option value={7}>Daily</option>
                        </select>
                      </div>
                    </div>
                    <label style={fieldLabel}>Preferred days</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {DAYS.map((d) => (
                        <DayChip key={d} day={d}
                          active={form.selectedDays.includes(d)}
                          onToggle={() => toggleDay(d)} />
                      ))}
                    </div>
                    <div style={{
                      marginTop: 10, padding: "8px 12px", background: "#fff",
                      borderRadius: 8, border: "1px solid #fecaca", fontSize: 12, color: "#555"
                    }}>
                      📋 Total visits: <strong>{totalVisits}</strong> &nbsp;|&nbsp;
                      Total base: <strong>₹{baseTotal.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                )}

                {/* ── Schedule ── */}
                <div style={{ ...sectionLabel }}>
                  Schedule
                  <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={fieldLabel}>Date</label>
                    <input style={inputStyle} type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Time</label>
                    <TimePicker value={form.timeSlot}
                      onChange={(v) => setForm({ ...form, timeSlot: v })} />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>Additional Notes (optional)</label>
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                    placeholder="Any specific instructions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                {/* ── Location ── */}
                <div style={{ ...sectionLabel }}>
                  Service Location
                  <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>Where should the service be performed?</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, useProfileLocation: true })}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        border: `1px solid ${form.useProfileLocation ? "#b91c1c" : "#fecaca"}`,
                        borderRadius: 10,
                        background: form.useProfileLocation ? "#7f1d1d" : "#fef2f2",
                        color: form.useProfileLocation ? "#fff" : "#888",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      🏠 Use My Home Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, useProfileLocation: false })}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        border: `1px solid ${!form.useProfileLocation ? "#b91c1c" : "#fecaca"}`,
                        borderRadius: 10,
                        background: !form.useProfileLocation ? "#7f1d1d" : "#fef2f2",
                        color: !form.useProfileLocation ? "#fff" : "#888",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      📍 Set New Location
                    </button>
                  </div>

                  {form.useProfileLocation ? (
                    <div style={{
                      padding: "12px 16px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 10,
                      fontSize: 13,
                      color: "#065f46"
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>📍 Using your profile location</div>
                      <div>{meData?.user?.location || "No location set in profile"}</div>
                      {meData?.user?.lat && meData?.user?.lng && (
                        <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>
                          Coordinates: {meData.user.lat.toFixed(4)}, {meData.user.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <LocationPicker
                      location={form.location}
                      lat={form.lat}
                      lng={form.lng}
                      onChange={(locationData) => setForm({ ...form, ...locationData })}
                    />
                  )}
                </div>

                <button className="bk-submit" disabled={isRequestButtonDisabled}
                  onClick={() => setShowConfirmModal(true)}>
                  {createdBooking ? hasBookingDetailsChanged ? "Update Request" : "Request Sent" : "Request Service"}
                </button>
              </div>

              {/* ── Right: Summary ── */}
              <div style={{ ...cs, position: "sticky", top: 20 }}>
                <div style={{ ...sectionLabel }}>
                  Payment Breakdown
                  <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                </div>

                <SumRow label="Base Price"
                  value={form.type === "contract"
                    ? `₹${basePrice} × ${totalVisits} visits`
                    : `₹${basePrice.toLocaleString("en-IN")}`} />
                <SumRow label="Booking Charge" value={`₹${bookingCharge}`} />
                <SumRow label="Service Fee" value={`₹${serviceFee}`} />
                {appliedCoupon && (
                  <SumRow label={`Coupon (${appliedCoupon.code})`}
                    value={`-₹${discount.toLocaleString("en-IN")}`} highlight />
                )}

                <div style={{
                  display: "flex", justifyContent: "space-between", fontSize: 18,
                  fontWeight: 800, padding: "12px 0 0", borderTop: "1px solid #fecaca", marginTop: 6
                }}>
                  <span>Total</span>
                  <span style={{ color: "#b91c1c" }}>₹{totalPayable.toLocaleString("en-IN")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  disabled={!createdBooking || createdBooking.status !== "accepted" || paymentDone}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: 13,
                    borderRadius: 12,
                    border: "none",
                    background: createdBooking && createdBooking.status === "accepted" && !paymentDone ? "#7f1d1d" : "#f3b2b2",
                    color: createdBooking && createdBooking.status === "accepted" && !paymentDone ? "#fff" : "#8b1f1f",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: !createdBooking || createdBooking.status !== "accepted" || paymentDone ? "not-allowed" : "pointer",
                    opacity: !createdBooking || createdBooking.status !== "accepted" || paymentDone ? 0.55 : 1,
                    transition: "background 0.15s"
                  }}>
                  {paymentDone ? "Payment Complete" : "Pay Now"}
                </button>
                {!createdBooking ? (
                  <p style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                    Request the service first. Payment will be enabled after provider approval.
                  </p>
                ) : !hasBookingDetailsChanged ? (
                  <p style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                    Your request has been sent. Change the date, time, or service details to submit a new request.
                  </p>
                ) : createdBooking.status !== "accepted" ? (
                  <p style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                    Details changed. You can submit the updated request now.
                  </p>
                ) : null}

                {/* Coupons */}
                {showCoupons && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{
                      background: "linear-gradient(135deg,#fff7f7,#fff)",
                      border: "1px dashed #f87171", borderRadius: 10, padding: "10px 13px",
                      display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10
                    }}>
                      <span style={{ fontSize: 18 }}>🎟️</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 2 }}>
                          You&apos;re eligible for coupons!
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          Your order qualifies for a discount.
                        </div>
                      </div>
                    </div>
                    {COUPONS.map((c) => (
                      <div key={c.code}
                        className={`bk-coupon-item ${appliedCoupon?.code === c.code ? "applied" : ""}`}
                        onClick={() => setAppliedCoupon(appliedCoupon?.code === c.code ? null : c)}>
                        <div>
                          <div style={{
                            fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                            letterSpacing: "0.05em",
                            color: appliedCoupon?.code === c.code ? "#15803d" : "#b91c1c"
                          }}>
                            {c.code}
                          </div>
                          <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{c.desc}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>
                          {c.pct ? `${c.pct}% OFF` : `₹${c.flat} OFF`}
                        </div>
                      </div>
                    ))}
                    {appliedCoupon && (
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 12, fontWeight: 600, color: "#15803d", marginTop: 6,
                        padding: "6px 10px", background: "#f0fdf4", borderRadius: 8
                      }}>
                        <span>Coupon applied ✓</span>
                        <span>-₹{discount.toLocaleString("en-IN")} saved!</span>
                      </div>
                    )}
                  </div>
                )}

                <Link href={`/providers/${provider._id}`}
                  style={{
                    display: "block", textAlign: "center", marginTop: 16, padding: "9px",
                    border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    color: "#888", textDecoration: "none", background: "#fef2f2"
                  }}>
                  ← Back to Provider
                </Link>
              </div>
            </div>
          ) : !error ? (
            <div style={{
              background: "#fff", border: "1px solid #fecaca", borderRadius: 16,
              padding: 40, textAlign: "center", fontSize: 13, color: "#aaa"
            }}>
              Loading provider details…
            </div>
          ) : null}

          {/* Post-payment success */}
          {paymentDone && createdBooking && (
            <div style={{
              background: "#fff", border: "1px solid #bbf7d0", borderLeft: "4px solid #15803d",
              borderRadius: 16, padding: 24, marginTop: 16
            }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#15803d", marginBottom: 8 }}>
                🎉 Booking Confirmed & Payment Received
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <StatusBadge status={createdBooking.status} />
                <span style={{
                  background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0",
                  fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20
                }}>Paid</span>
              </div>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Booking ID: <code>{createdBooking._id}</code>
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/user/bookings"
                  style={{
                    padding: "9px 18px", background: "#7f1d1d", color: "#fff",
                    borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700
                  }}>
                  My Bookings
                </Link>
                <Link href={`/providers/${providerId}`}
                  style={{
                    padding: "9px 18px", border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#b91c1c", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600
                  }}>
                  Provider Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Confirmation modal ── */}
      {showConfirmModal && (
        <div className="bk-overlay" onClick={(e) => { if (e.target.classList.contains("bk-overlay")) setShowConfirmModal(false); }}>
          <div className="bk-modal">
            <div className="bk-modal-head">
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>Confirm Your Booking</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Review everything before you pay.</div>
            </div>
            <div style={{ padding: "16px 24px", maxHeight: "50vh", overflowY: "auto" }}>
              {[
                ["Provider", provider?.businessName],
                ["Service", selectedService?.title || "—"],
                ["Type", form.type === "contract" ? "Contract-based" : "One-time"],
                ["Date", form.scheduledDate || "Not selected"],
                ["Time", form.timeSlot || "Not selected"],
                ...(form.type === "contract" ? [
                  ["Duration", `${form.contractMonths} month${form.contractMonths > 1 ? "s" : ""}`],
                  ["Frequency", `${form.contractDays} day${form.contractDays > 1 ? "s" : ""}/week`],
                  ["Days", form.selectedDays.join(", ")],
                  ["Total Visits", `${totalVisits} visits`],
                ] : []),
                ...(appliedCoupon ? [["Coupon", `${appliedCoupon.code} (-₹${discount})`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="bk-modal-row">
                  <span style={{ color: "#888", fontWeight: 500, fontSize: 13 }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 20,
              fontWeight: 800, padding: "14px 24px", borderTop: "2px solid #fecaca",
              background: "#fef2f2"
            }}>
              <span>Total Payable</span>
              <span style={{ color: "#b91c1c" }}>₹{totalPayable.toLocaleString("en-IN")}</span>
            </div>

            {/* Advance payment option for contracts */}
            {form.type === "contract" && (
              <div style={{ padding: "0 24px 12px" }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#b91c1c",
                  letterSpacing: "0.07em", textTransform: "uppercase", margin: "12px 0 8px"
                }}>
                  Payment Option
                </div>
                <div className="bk-adv-toggle">
                  <button className={`bk-adv-btn ${!form.advanceOnly ? "active" : ""}`}
                    onClick={() => setForm({ ...form, advanceOnly: false })}>
                    Full Payment<br />
                    <span style={{ fontSize: 10, opacity: 0.8 }}>₹{totalPayable.toLocaleString("en-IN")}</span>
                  </button>
                  <button className={`bk-adv-btn ${form.advanceOnly ? "active" : ""}`}
                    onClick={() => setForm({ ...form, advanceOnly: true })}>
                    Advance (30%)<br />
                    <span style={{ fontSize: 10, opacity: 0.8 }}>₹{advanceAmount.toLocaleString("en-IN")}</span>
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
                  {form.advanceOnly ? "Remaining balance payable before first visit." : "Pay the full amount now."}
                </div>
              </div>
            )}

            <div style={{ padding: "12px 24px 20px", display: "flex", gap: 8 }}>
              <button onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, border: "1px solid #e5e5e5",
                  background: "#fff", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                }}>
                Go Back
              </button>
              <button onClick={createBooking} disabled={submitting}
                style={{
                  flex: 2, padding: 10, borderRadius: 10, border: "none", background: "#7f1d1d",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  opacity: submitting ? 0.6 : 1
                }}>
                {submitting ? "Requesting…" : `Request Service`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock payment modal */}
      {showPayModal && createdBooking && (
        <MockPaymentModal
          booking={createdBooking}
          total={form.advanceOnly ? advanceAmount : totalPayable}
          onSuccess={() => { setShowPayModal(false); setPaymentDone(true); }}
          onFailure={(msg) => { setShowPayModal(false); setError(msg || "Payment failed. Retry from My Bookings."); }}
          onCancel={() => setShowPayModal(false)}
        />
      )}
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#fef2f2" }}>
        <AppNav />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px" }}>
          <div style={{
            background: "#fff", border: "1px solid #fecaca", borderRadius: 14,
            padding: 40, textAlign: "center", fontSize: 13, color: "#aaa"
          }}>
            Loading booking page…
          </div>
        </div>
      </main>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
