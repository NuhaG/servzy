"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProviderServicesPage() {
  const [providerId, setProviderId] = useState("");
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  async function loadProvider() {
    setError("");
    try {
      const response = await fetch(`/api/providers/${providerId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load provider");
      setProvider(data);
    } catch (err) {
      setError(err.message);
      setProvider(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Provider Services</h1>
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

        {error ? <p className="text-red-600">{error}</p> : null}

        {provider ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{provider.businessName}</h2>
            {provider.services?.map((service) => (
              <div key={service._id} className="rounded border p-3">
                <p className="font-medium">{service.title}</p>
                <p className="text-sm text-slate-600">{service.category}</p>
                <Link
                  href={`/provider/services/${service._id}/edit`}
                  className="mt-2 inline-block text-sm text-blue-700 underline"
                >
                  Edit Service
                </Link>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
