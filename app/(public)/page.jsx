"use client";

import Link from "next/link";

export default function PublicPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6 rounded-xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Servzy</h1>
        <p className="text-sm text-slate-600">
          Landing to Login/Signup to Services to Provider Details to Booking to Provider Action to User Review.
        </p>
        <p className="text-xs text-slate-500">
          Seed data from backend using POST <code>/api/seed</code>.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link className="rounded border p-3 hover:bg-slate-50" href="/sign-in">
            Login
          </Link>
          <Link className="rounded border p-3 hover:bg-slate-50" href="/sign-up">
            Signup
          </Link>
          <Link className="rounded border p-3 hover:bg-slate-50" href="/services">
            Public Services
          </Link>
          <Link className="rounded border p-3 hover:bg-slate-50" href="/user/dashboard">
            User Dashboard
          </Link>
          <Link className="rounded border p-3 hover:bg-slate-50" href="/provider/dashboard">
            Provider Dashboard
          </Link>
          <Link className="rounded border p-3 hover:bg-slate-50" href="/admin/dashboard">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
