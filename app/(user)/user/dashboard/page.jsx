"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "provider") {
          router.replace("/provider/dashboard");
          return;
        }
        if (meData.user?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        setUser(meData.user);

        const bookingsResponse = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
        const bookingsData = await bookingsResponse.json();
        if (!bookingsResponse.ok) throw new Error(bookingsData.error || "Failed to load bookings");

        const total = bookingsData.length;
        const completed = bookingsData.filter((item) => item.status === "completed").length;
        const pending = bookingsData.filter((item) => ["pending", "accepted"].includes(item.status)).length;
        setStats({ total, completed, pending });
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
          <h1 className="sv-title">User Dashboard</h1>
          <p className="sv-subtitle mt-2">{user ? `${user.name} (${user.email})` : "Loading account..."}</p>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sv-card p-4"><p className="sv-subtitle">Total Bookings</p><p className="text-2xl font-bold">{stats.total}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Completed</p><p className="text-2xl font-bold">{stats.completed}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Active</p><p className="text-2xl font-bold">{stats.pending}</p></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/services" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">Browse Services</Link>
          <Link href="/user/bookings" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">Manage Bookings</Link>
          <Link href="/user/reviews" className="sv-card p-4 hover:translate-y-[-2px] transition-transform">Manage Reviews</Link>
        </div>
      </div>
    </main>
  );
}
