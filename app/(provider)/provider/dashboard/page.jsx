"use client";

import Link from "next/link";

export default function ProviderDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/provider/services" className="rounded border p-3 hover:bg-slate-50">
            My Services
          </Link>
          <Link href="/provider/services/new" className="rounded border p-3 hover:bg-slate-50">
            Create Service
          </Link>
          <Link href="/provider/bookings" className="rounded border p-3 hover:bg-slate-50">
            Booking Requests
          </Link>
        </div>
      </div>
    </main>
  );
}
