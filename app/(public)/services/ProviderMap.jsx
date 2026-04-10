"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = [19.076, 72.8777];
const DEFAULT_ZOOM = 11;

function loadLeafletAssets() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window not available"));
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoaderPromise) return window.__leafletLoaderPromise;

  window.__leafletLoaderPromise = new Promise((resolve, reject) => {
    const cssId = "leaflet-cdn-css";
    const jsId = "leaflet-cdn-js";

    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(jsId);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Leaflet")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = jsId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.body.appendChild(script);
  });

  return window.__leafletLoaderPromise;
}

export default function ProviderMap({ providers }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const providerLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const geolocationSupported =
    typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined";
  const [leafletError, setLeafletError] = useState("");
  const [userLocationError, setUserLocationError] = useState("");
  const [userPosition, setUserPosition] = useState(null);

  const validProviders = useMemo(() => {
    return (providers || []).filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)));
  }, [providers]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        setLeafletError("");
        const L = await loadLeafletAssets();
        if (cancelled || !mapElRef.current || mapRef.current) return;

        const map = L.map(mapElRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        mapRef.current = map;
        providerLayerRef.current = L.layerGroup().addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      } catch (error) {
        if (!cancelled) {
          setLeafletError(error?.message || "Failed to load map.");
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!geolocationSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        });
        setUserLocationError("");
      },
      () => {
        setUserLocationError("Location permission denied. Showing providers only.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [geolocationSupported]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = providerLayerRef.current;
    if (!map || !layer || !window.L) return;
    const L = window.L;

    layer.clearLayers();

    validProviders.forEach((provider) => {
      const marker = L.marker([Number(provider.lat), Number(provider.lng)]);
      marker.bindPopup(
        `<div style="min-width:180px">
          <strong>${provider.businessName || "Provider"}</strong><br/>
          ${provider.serviceTitle || "Service"}<br/>
          ${provider.location || "Unknown location"}<br/>
          Rating: ${Number(provider.avgRating || 0).toFixed(1)}
        </div>`,
      );
      marker.addTo(layer);
    });

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userPosition && Number.isFinite(userPosition.lat) && Number.isFinite(userPosition.lng)) {
      userMarkerRef.current = L.circleMarker([userPosition.lat, userPosition.lng], {
        radius: 8,
        color: "#1d4ed8",
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindPopup("You are here")
        .addTo(map);
    }

    const points = validProviders.map((item) => [Number(item.lat), Number(item.lng)]);
    if (userPosition && Number.isFinite(userPosition.lat) && Number.isFinite(userPosition.lng)) {
      points.push([userPosition.lat, userPosition.lng]);
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [validProviders, userPosition]);

  return (
    <div className="sv-card p-3">
      <p className="sv-subtitle mb-2">Provider map view</p>
      {leafletError ? <p className="text-red-700 text-sm mb-2">{leafletError}</p> : null}
      {!geolocationSupported ? (
        <p className="text-amber-700 text-sm mb-2">Location is not supported in this browser.</p>
      ) : null}
      {userLocationError ? <p className="text-amber-700 text-sm mb-2">{userLocationError}</p> : null}
      <div ref={mapElRef} style={{ width: "100%", height: 520, borderRadius: 12, overflow: "hidden" }} />
    </div>
  );
}
