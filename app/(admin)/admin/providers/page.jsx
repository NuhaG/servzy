"use client";

import { useState } from "react";

export default function AdminProvidersPage() {
  const [providerId, setProviderId] = useState("");
  const [provider, setProvider] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProvider() {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/providers/${providerId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch provider");
      setProvider(data);
    } catch (err) {
      setError(err.message);
      setProvider(null);
    }
  }

  async function updateProviderStatus(action) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/providers/${providerId}/${action}`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} provider`);
      setMessage(data.message || `Provider ${action}d`);
      await loadProvider();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Providers</h1>
        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Provider ID"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          />
          <button onClick={loadProvider} className="rounded bg-slate-900 px-4 py-2 text-white">
            Load
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => updateProviderStatus("approve")}
            className="rounded bg-green-700 px-4 py-2 text-white"
          >
            Approve
          </button>
          <button
            onClick={() => updateProviderStatus("block")}
            className="rounded bg-red-700 px-4 py-2 text-white"
          >
            Block
          </button>
        </div>

        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {provider ? (
          <div className="rounded border p-3">
            <p className="font-medium">{provider.businessName}</p>
            <p className="text-sm">Status: {provider.status}</p>
            <p className="text-sm">Location: {provider.location || "-"}</p>
            <p className="text-sm">Rating: {provider.avgRating} ({provider.totalReviews})</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
