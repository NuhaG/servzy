"use client";

import { useState } from "react";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  async function loadUsers(targetPage) {
    setError("");
    try {
      const response = await fetch(`/api/users?page=${targetPage}&limit=20`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
      setMeta(data);
      setPage(targetPage);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <button onClick={() => loadUsers(page)} className="rounded bg-slate-900 px-4 py-2 text-white">
          Load Users
        </button>
        {error ? <p className="text-red-600">{error}</p> : null}
        {meta ? (
          <p className="text-sm text-slate-600">
            Page {meta.page} of {meta.totalPages} | Total: {meta.totalUsers}
          </p>
        ) : null}
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user._id} className="rounded border p-3">
              <p className="font-medium">{user.name || "Unnamed User"}</p>
              <p className="text-sm">{user.email}</p>
              <p className="text-sm">Role: {user.role}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
