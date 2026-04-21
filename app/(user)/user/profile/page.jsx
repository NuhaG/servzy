"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

export default function UserProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showMap, setShowMap] = useState(false);
    const mapElRef = useRef(null);
    const mapRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        lat: null,
        lng: null,
    });

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await fetch("/api/me");
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to load user");
                if (data.user) {
                    setUser(data.user);
                    setFormData({
                        name: data.user.name || "",
                        email: data.user.email || "",
                        phone: data.user.phone || "",
                        location: data.user.location || "",
                        lat: data.user.lat || null,
                        lng: data.user.lng || null,
                    });

                    // Get browser location if not already set
                    if (!data.user.lat || !data.user.lng) {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const { latitude, longitude } = position.coords;
                                    setFormData((prev) => ({
                                        ...prev,
                                        lat: Number(latitude.toFixed(6)),
                                        lng: Number(longitude.toFixed(6)),
                                    }));
                                },
                                (error) => {
                                    console.log("Geolocation not available:", error.message);
                                }
                            );
                        }
                    }
                }
            } catch (err) {
                setError(err.message);
            }
        }
        loadUser();
    }, []);

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
            const defaultLat = formData.lat || 19.076;
            const defaultLng = formData.lng || 72.8777;
            const map = L.map(mapElRef.current).setView([defaultLat, defaultLng], 15);
            mapRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);

            let marker = null;
            if (formData.lat && formData.lng) {
                marker = L.marker([formData.lat, formData.lng])
                    .addTo(map)
                    .bindPopup("Your location")
                    .openPopup();
            }

            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                setFormData((prev) => ({
                    ...prev,
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                }));

                if (marker) map.removeLayer(marker);
                marker = L.marker([lat, lng])
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
    }, [showMap]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update profile");

            setSuccess("Profile updated successfully!");
            setUser(data.user);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user)
        return (
            <>
                <AppNav />
                <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
                    Loading...
                </div>
            </>
        );

    return (
        <>
            <style>{`
        .up-page { min-height: 100vh; background: #fef9f3; }
        .up-shell { max-width: 600px; margin: 0 auto; padding: 36px 20px 64px; }

        /* Header */
        .up-header {
          background: #fff;
          border: 1px solid #fecaca;
          border-left: 4px solid #b91c1c;
          border-radius: 12px;
          padding: 22px 26px;
          margin-bottom: 20px;
        }
        .up-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b91c1c;
          margin-bottom: 4px;
        }
        .up-title {
          font-size: 22px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.02em;
          margin: 0;
        }

        /* Form */
        .up-form {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 24px;
        }

        .up-form-group {
          margin-bottom: 18px;
        }
        .up-form-group:last-child {
          margin-bottom: 0;
        }

        .up-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
        }

        .up-input {
          width: 100%;
          padding: 10px 13px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 13px;
          color: #111;
          background: #fef2f2;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .up-input:focus {
          border-color: #b91c1c;
          background: #fff;
        }
        .up-input:disabled {
          background: #f5f5f5;
          color: #aaa;
          cursor: not-allowed;
        }

        .up-location-container {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
        }

        .up-location-display {
          flex: 1;
          background: #f9f9f9;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e5e5e5;
          font-size: 12px;
          color: #555;
        }

        .up-btn-map {
          padding: 8px 16px;
          background: #0369a1;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .up-btn-map:hover {
          background: #0284c7;
        }

        .up-actions {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #fef2f2;
        }

        .up-btn {
          flex: 1;
          padding: 11px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.15s;
        }

        .up-btn-submit {
          background: #7f1d1d;
          color: #fff;
          border-color: #7f1d1d;
        }
        .up-btn-submit:hover:not(:disabled) {
          background: #991b1b;
        }
        .up-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .up-btn-cancel {
          background: #fff;
          color: #555;
          border-color: #e5e5e5;
        }
        .up-btn-cancel:hover {
          border-color: #ccc;
          background: #f9f9f9;
        }

        .up-alert {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .up-error {
          background: #fff1f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .up-success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        /* Map Modal */
        .up-map-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .up-map-modal {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #fecaca;
          width: 100%;
          max-width: 700px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .up-map-header {
          padding: 20px 22px;
          border-bottom: 1px solid #fef2f2;
          border-left: 4px solid #0369a1;
        }

        .up-map-title {
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin: 0 0 3px;
        }

        .up-map-subtitle {
          font-size: 12px;
          color: #888;
        }

        .up-map-body {
          flex: 1;
          overflow: hidden;
          min-height: 400px;
        }

        #up-location-map {
          width: 100%;
          height: 100%;
          min-height: 400px;
        }

        .up-map-footer {
          padding: 14px 22px;
          border-top: 1px solid #fef2f2;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .up-btn-close {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid #e5e5e5;
          background: #fff;
          color: #555;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .up-btn-close:hover {
          border-color: #ccc;
          background: #f9f9f9;
        }

        .up-btn-confirm {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: #0369a1;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .up-btn-confirm:hover {
          background: #0284c7;
        }
      `}</style>

            <main className="up-page">
                <AppNav />
                <div className="up-shell">
                    {/* Header */}
                    <div className="up-header">
                        <p className="up-eyebrow">Account</p>
                        <h1 className="up-title">Edit Profile</h1>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="up-alert up-error">
                            <span>❌</span>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="up-alert up-success">
                            <span>✅</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="up-form" onSubmit={handleSubmit}>
                        <div className="up-form-group">
                            <label className="up-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="up-input"
                                placeholder="Your name"
                            />
                        </div>

                        <div className="up-form-group">
                            <label className="up-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled
                                className="up-input"
                            />
                        </div>

                        <div className="up-form-group">
                            <label className="up-label">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="up-input"
                                placeholder="Your phone number"
                            />
                        </div>

                        <div className="up-form-group">
                            <label className="up-label">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="up-input"
                                placeholder="Your address or area"
                            />
                            <div className="up-location-container">
                                <div className="up-location-display">
                                    {formData.lat && formData.lng
                                        ? `📍 ${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}`
                                        : "No location set"}
                                </div>
                                <button
                                    type="button"
                                    className="up-btn-map"
                                    onClick={() => setShowMap(!showMap)}
                                >
                                    {showMap ? "Hide Map" : "Set on Map"}
                                </button>
                            </div>
                        </div>

                        <div className="up-actions">
                            <button type="submit" className="up-btn up-btn-submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                className="up-btn up-btn-cancel"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Map Modal */}
            {showMap && (
                <div className="up-map-overlay" onClick={() => setShowMap(false)}>
                    <div className="up-map-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="up-map-header">
                            <h3 className="up-map-title">📍 Set Your Location</h3>
                            <p className="up-map-subtitle">
                                Click on the map to select your location
                            </p>
                        </div>
                        <div className="up-map-body">
                            <div id="up-location-map" ref={mapElRef}></div>
                        </div>
                        <div className="up-map-footer">
                            <button
                                className="up-btn-close"
                                onClick={() => setShowMap(false)}
                            >
                                Close
                            </button>
                            <button
                                className="up-btn-confirm"
                                onClick={() => setShowMap(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
