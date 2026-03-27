"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

function statusLabel(status) {
  if (status === "accepted") return "confirmed";
  return status;
}

export default function ProviderDetailsPage() {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
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
          fetch("/api/me"),
        ]);

        const providerData = await providerResponse.json();
        const contextData = await contextResponse.json();

        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");
        if (!contextResponse.ok) throw new Error(contextData.error || "Please sign in to book a provider");

        setProvider(providerData);
        setCurrentUserId(contextData.user?._id || "");
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
  const selectedService = useMemo(
    () => serviceOptions.find((item) => item._id === form.serviceId) || serviceOptions[0],
    [serviceOptions, form.serviceId]
  );

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
          userId: currentUserId,
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
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell sv-card max-w-6xl space-y-5 p-6">
        <Link href="/services" className="text-sm text-blue-700 underline">
          Back to services
        </Link>

        {error ? <p className="text-red-700">{error}</p> : null}
        {!provider ? <p>Loading provider...</p> : null}

        {provider ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Image
                  src={provider.services?.[0]?.images?.[0] || "https://picsum.photos/seed/provider-detail/1000/700"}
                  alt={provider.businessName}
                  width={1000}
                  height={700}
                  className="h-72 w-full rounded object-cover"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <h1 className="text-2xl font-bold">{provider.businessName}</h1>
                <p className="text-sm text-slate-600">{provider.location}</p>
                <p className="text-sm">Rating: {provider.avgRating || 0}</p>
                <p className="text-sm">Reliability: {provider.reliabilityScore || "-"}</p>
                <p className="text-sm">Services: {(provider.services || []).map((item) => item.title).join(", ")}</p>
                <div className="grid gap-2 sm:grid-cols-4 pt-2">
                  <div className="sv-card p-3"><p className="sv-subtitle">Bookings</p><p className="text-xl font-bold">{provider.totalBookings || 0}</p></div>
                  <div className="sv-card p-3"><p className="sv-subtitle">Accept Rate</p><p className="text-xl font-bold">{provider.acceptRate || 0}%</p></div>
                  <div className="sv-card p-3"><p className="sv-subtitle">Reliability</p><p className="text-xl font-bold">{provider.reliabilityScore || 0}%</p></div>
                  <div className="sv-card p-3"><p className="sv-subtitle">Cancellations</p><p className="text-xl font-bold">{provider.cancellations || 0}</p></div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <form onSubmit={createBooking} className="grid gap-3 sv-card p-4 md:grid-cols-2">
              <h2 className="md:col-span-2 text-lg font-semibold">Book this provider</h2>
              {!currentUserId ? (
                <p className="md:col-span-2 text-sm text-amber-700">Sign in to book this provider.</p>
              ) : null}
              <select
                className="sv-input"
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
                className="sv-input"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="one-time">one-time</option>
                <option value="contract">contract</option>
              </select>
              <input
                className="sv-input"
                type="date"
                value={form.scheduledDate}
                onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
                required
              />
              <input
                className="sv-input"
                placeholder="10:00 AM"
                value={form.timeSlot}
                onChange={(event) => setForm({ ...form, timeSlot: event.target.value })}
                required
              />
              <button className="md:col-span-2 sv-btn disabled:cursor-not-allowed disabled:opacity-60" disabled={!currentUserId}>
                Make Booking
              </button>
            </form>
              <aside className="sv-card p-4 space-y-3">
                <h3 className="font-semibold">Pricing Breakdown</h3>
                <p className="sv-subtitle">Base Price: Rs {selectedService?.price || provider.basePrice || 0}</p>
                <p className="sv-subtitle">Booking Charge: Rs {provider.bookingCharge || 0}</p>
                <p className="sv-subtitle">Consultation: Rs {provider.consultationFee || 0}</p>
                <p className="sv-subtitle">Service Fee: Rs {provider.serviceFee || 0}</p>
                <hr style={{ borderColor: "var(--sv-border)" }} />
                <p style={{ fontWeight: 700 }}>
                  Total: Rs {(Number(selectedService?.price || provider.basePrice || 0) + Number(provider.bookingCharge || 0) + Number(provider.consultationFee || 0) + Number(provider.serviceFee || 0))}
                </p>
                <p className="sv-subtitle">Verified provider with live reliability scoring.</p>
              </aside>
            </div>
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
