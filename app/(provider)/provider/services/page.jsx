"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderServicesPage() {
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProvider() {
      try {
        setError("");
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load account");
        if (!meData.provider?._id) throw new Error("Provider profile not found for this account");

        const providerResponse = await fetch(`/api/providers/${meData.provider._id}`);
        const providerData = await providerResponse.json();
        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");
        setProvider(providerData);
      } catch (err) {
        setError(err.message);
      }
    }

    loadProvider();
  }, []);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <div className="sv-card p-6 space-y-4">
        <h1 className="sv-title">My Services</h1>
        {error ? <p className="text-red-700">{error}</p> : null}

        {provider ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{provider.businessName}</h2>
            {provider.services?.map((service) => (
              <div key={service._id} className="sv-card p-3">
                <p className="font-medium">{service.title}</p>
                <p className="text-sm text-slate-600">{service.category}</p>
                <Link href={`/provider/services/${service._id}/edit`} className="mt-2 inline-block text-sm text-blue-700 underline">
                  Edit Service
                </Link>
              </div>
            ))}
            {provider.services?.length === 0 ? <p className="text-sm text-slate-500">No services yet.</p> : null}
          </section>
        ) : null}
        </div>
      </div>
    </main>
  );
}
