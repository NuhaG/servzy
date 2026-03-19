"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function statusLabel(status) {
  if (status === "accepted") return "confirmed";
  return status;
}

export default function ProviderDetailsPage() {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [demoUserId, setDemoUserId] = useState("");
  const [form, setForm] = useState({
    serviceId: "",
    scheduledDate: "",
    timeSlot: "",
    type: "one-time",
  });
  const [createdBooking, setCreatedBooking] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        setError("");
        const [providerResponse, contextResponse] = await Promise.all([
          fetch(`/api/providers/${providerId}`),
          fetch("/api/demo/context"),
        ]);

        const providerData = await providerResponse.json();
        const contextData = await contextResponse.json();

        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");
        if (!contextResponse.ok) throw new Error(contextData.error || "Failed to load demo context");

        setProvider(providerData);
        setDemoUserId(contextData.currentUser?._id || "");
        if (providerData.services?.[0]?._id) {
          setForm((prev) => ({ ...prev, serviceId: providerData.services[0]._id }));
        }
      } catch (err) {
        setError(err.message);
      }
    }

    if (providerId) loadPageData();
  }, [providerId]);

  const serviceOptions = useMemo(() => provider?.services || [], [provider]);

  async function createBooking(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCreatedBooking(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: demoUserId,
          serviceId: form.serviceId,
          scheduledDate: form.scheduledDate,
          timeSlot: form.timeSlot,
          type: form.type,
          notes: "Created from provider details page",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create booking");
      setCreatedBooking(data);
      setMessage("Booking created. It is now visible on provider and user pages.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-5 rounded-xl bg-white p-6 shadow">
        <Link href="/services" className="text-sm text-blue-700 underline">
          Back to services
        </Link>

        {error ? <p className="text-red-600">{error}</p> : null}
        {!provider ? <p>Loading provider...</p> : null}

        {provider ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Image
                  src={provider.services?.[0]?.images?.[0] || "https://picsum.photos/seed/provider-detail/1000/700"}
                  alt={provider.businessName}
                  width={1000}
                  height={700}
                  className="h-72 w-full rounded object-cover"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{provider.businessName}</h1>
                <p className="text-sm text-slate-600">{provider.location}</p>
                <p className="text-sm">Rating: {provider.avgRating || 0}</p>
                <p className="text-sm">Reliability: {provider.reliabilityScore || "-"}</p>
                <p className="text-sm">Services: {(provider.services || []).map((item) => item.title).join(", ")}</p>
              </div>
            </div>

            <form onSubmit={createBooking} className="grid gap-3 rounded border p-4 md:grid-cols-2">
              <h2 className="md:col-span-2 text-lg font-semibold">Book this provider</h2>
              <select
                className="rounded border p-2"
                value={form.serviceId}
                onChange={(event) => setForm({ ...form, serviceId: event.target.value })}
                required
              >
                {serviceOptions.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded border p-2"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="one-time">one-time</option>
                <option value="contract">contract</option>
              </select>
              <input
                className="rounded border p-2"
                type="date"
                value={form.scheduledDate}
                onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
                required
              />
              <input
                className="rounded border p-2"
                placeholder="10:00 AM"
                value={form.timeSlot}
                onChange={(event) => setForm({ ...form, timeSlot: event.target.value })}
                required
              />
              <button className="md:col-span-2 rounded bg-slate-900 px-4 py-2 text-white">
                Make Booking
              </button>
            </form>
          </>
        ) : null}

        {message ? <p className="text-green-700">{message}</p> : null}
        {createdBooking ? (
          <div className="rounded border p-3 text-sm">
            <p>Booking ID: {createdBooking._id}</p>
            <p>Status: {statusLabel(createdBooking.status)}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
