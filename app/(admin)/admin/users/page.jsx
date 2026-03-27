"use client";

import { useEffect } from "react";
import { useState } from "react";
import AppNav from "@/components/AppNav";

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

  useEffect(() => {
    loadUsers(1);
  }, []);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <div className="sv-card p-6 space-y-4">
        <h1 className="sv-title">Admin Users</h1>
        <button onClick={() => loadUsers(page)} className="sv-btn">
          Load Users
        </button>
        {error ? <p className="text-red-700">{error}</p> : null}
        {meta ? (
          <p className="sv-subtitle">
            Page {meta.page} of {meta.totalPages} | Total: {meta.totalUsers}
          </p>
        ) : null}
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user._id} className="sv-card p-3">
              <p className="font-medium">{user.name || "Unnamed User"}</p>
              <p className="text-sm">{user.email}</p>
              <p className="text-sm">Role: {user.role}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </main>
  );
}
