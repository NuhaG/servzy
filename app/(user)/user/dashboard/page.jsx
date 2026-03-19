"use client";

import Link from "next/link";

export default function UserDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <p className="text-sm text-slate-600">
          Use seeded IDs from the home page to create bookings and reviews.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/services" className="rounded border p-3 hover:bg-slate-50">
            Browse Services
          </Link>
          <Link href="/user/bookings" className="rounded border p-3 hover:bg-slate-50">
            Manage Bookings
          </Link>
          <Link href="/user/reviews" className="rounded border p-3 hover:bg-slate-50">
            Manage Reviews
          </Link>
        </div>
      </div>
    </main>
  );
}
