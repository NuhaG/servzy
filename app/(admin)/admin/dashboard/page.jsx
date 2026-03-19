"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/admin/users" className="rounded border p-3 hover:bg-slate-50">
            Users
          </Link>
          <Link href="/admin/providers" className="rounded border p-3 hover:bg-slate-50">
            Providers
          </Link>
          <Link href="/admin/bookings" className="rounded border p-3 hover:bg-slate-50">
            Bookings
          </Link>
        </div>
      </div>
    </main>
  );
}
