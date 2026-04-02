"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok)
          throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "provider") {
          router.replace("/provider/dashboard");
          return;
        }
        if (meData.user?.role === "user") {
          router.replace("/user/dashboard");
          return;
        }

        const [usersResponse, providersResponse, bookingsResponse] =
          await Promise.all([
            fetch("/api/users?page=1&limit=1"),
            fetch("/api/providers?includeAll=1"),
            fetch("/api/bookings"),
          ]);

        const usersData = await usersResponse.json();
        const providersData = await providersResponse.json();
        const bookingsData = await bookingsResponse.json();

        if (!usersResponse.ok)
          throw new Error(usersData.error || "Failed to load users");
        if (!providersResponse.ok)
          throw new Error(providersData.error || "Failed to load providers");
        if (!bookingsResponse.ok)
          throw new Error(bookingsData.error || "Failed to load bookings");

        setStats({
          users: usersData.totalUsers || 0,
          providers: providersData.length || 0,
          bookings: bookingsData.length || 0,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, [router]);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-5">
        <div className="sv-card p-6">
          <h1 className="sv-title">Admin Dashboard</h1>
          <p className="sv-subtitle mt-2">
            Platform-wide visibility from live database records.
          </p>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sv-card p-4">
            <p className="sv-subtitle">Total Users</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
          <div className="sv-card p-4">
            <p className="sv-subtitle">Total Providers</p>
            <p className="text-2xl font-bold">{stats.providers}</p>
          </div>
          <div className="sv-card p-4">
            <p className="sv-subtitle">Total Bookings</p>
            <p className="text-2xl font-bold">{stats.bookings}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="sv-card p-4 hover:translate-y-[-2px] transition-transform"
          >
            Users
          </Link>
          <Link
            href="/admin/providers"
            className="sv-card p-4 hover:translate-y-[-2px] transition-transform"
          >
            Providers
          </Link>
          <Link
            href="/admin/bookings"
            className="sv-card p-4 hover:translate-y-[-2px] transition-transform"
          >
            Bookings
          </Link>
          <Link
            href="/admin/complaints"
            className="sv-card p-4 hover:translate-y-[-2px] transition-transform"
          >
            Complaints
          </Link>
        </div>
      </div>
    </main>
  );
}
