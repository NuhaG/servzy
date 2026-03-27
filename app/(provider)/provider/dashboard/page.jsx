"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderDashboardPage() {
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({ services: 0, bookings: 0, pending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load account");
        if (!meData.provider?._id) throw new Error("Provider profile not found for this account");

        const providerResponse = await fetch(`/api/providers/${meData.provider._id}`);
        const providerData = await providerResponse.json();
        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");
        setProvider(providerData);

        const bookingsResponse = await fetch(`/api/bookings?providerId=${encodeURIComponent(meData.provider._id)}`);
        const bookingsData = await bookingsResponse.json();
        if (!bookingsResponse.ok) throw new Error(bookingsData.error || "Failed to load bookings");

        setStats({
          services: providerData.services?.length || 0,
          bookings: bookingsData.length,
          pending: bookingsData.filter((item) => item.status === "pending").length,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-5">
        <div className="sv-card p-6">
          <h1 className="sv-title">Provider Dashboard</h1>
          <p className="sv-subtitle mt-2">
            {provider ? `${provider.businessName} | Status: ${provider.status}` : "Loading provider..."}
          </p>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sv-card p-4"><p className="sv-subtitle">My Services</p><p className="text-2xl font-bold">{stats.services}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Bookings</p><p className="text-2xl font-bold">{stats.bookings}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Pending Requests</p><p className="text-2xl font-bold">{stats.pending}</p></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/provider/services" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">My Services</Link>
          <Link href="/provider/services/new" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">Create Service</Link>
          <Link href="/provider/bookings" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">Booking Requests</Link>
        </div>
      </div>
    </main>
  );
}
