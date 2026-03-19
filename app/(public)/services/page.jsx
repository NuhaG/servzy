"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PublicServicesPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load services");

        const map = new Map();
        for (const service of data) {
          const provider = service.providerId;
          if (!provider?._id) continue;

          const existing = map.get(provider._id);
          if (existing) {
            existing.services.push(service.title);
            continue;
          }

          map.set(provider._id, {
            id: provider._id,
            name: provider.businessName,
            rating: provider.avgRating || 0,
            location: provider.location || "Unknown",
            photo: service.images?.[0] || "https://picsum.photos/seed/provider-fallback/800/500",
            services: [service.title],
          });
        }

        setProviders(Array.from(map.values()));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-bold">Providers</h1>
        {loading ? <p>Loading...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <article key={provider.id} className="rounded-lg bg-white p-4 shadow">
              <Image
                src={provider.photo}
                alt={provider.name}
                className="mb-3 h-44 w-full rounded object-cover"
                width={800}
                height={500}
              />
              <h2 className="text-lg font-semibold">{provider.name}</h2>
              <p className="text-sm text-slate-600">{provider.location}</p>
              <p className="text-sm">Rating: {provider.rating}</p>
              <p className="text-sm">Services: {provider.services.join(", ")}</p>
              <Link
                href={`/providers/${provider.id}`}
                className="mt-3 inline-block rounded bg-slate-900 px-3 py-2 text-sm text-white"
              >
                View Provider
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
