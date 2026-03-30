"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");

  const [provider, setProvider] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
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
    async function loadPage() {
      try {
        setError("");
        if (!providerId) {
          throw new Error("Provider is required.");
        }

        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) {
          router.push(`/sign-in?redirect_url=${encodeURIComponent(`/book?providerId=${providerId}`)}`);
          return;
        }
        if (meData.user?.role !== "user") {
          throw new Error("Only user accounts can create bookings.");
        }
        setCurrentRole(meData.user?.role || "");

        const providerResponse = await fetch(`/api/providers/${providerId}`);
        const providerData = await providerResponse.json();
        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");

        setProvider(providerData);
        if (providerData.services?.[0]?._id) {
          setForm((prev) => ({ ...prev, serviceId: providerData.services[0]._id }));
        }
      } catch (err) {
        setError(err.message);
      }
    }

    loadPage();
  }, [providerId, router]);

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
      if (currentRole !== "user") {
        throw new Error("Only user accounts can create bookings.");
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: form.serviceId,
          scheduledDate: form.scheduledDate,
          timeSlot: form.timeSlot,
          type: form.type,
          notes: "Created from booking page",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create booking");
      setCreatedBooking(data);
      setMessage("Booking confirmed. Check your dashboard and bookings page.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <section className="sv-card p-5">
          <h1 className="sv-title">Confirm Your Booking</h1>
          <p className="sv-subtitle mt-2">Review details and complete your booking.</p>
          {error ? <p className="text-red-700 mt-2">{error}</p> : null}
          {message ? <p className="text-green-700 mt-2">{message}</p> : null}
        </section>

        {provider ? (
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <form onSubmit={createBooking} className="sv-card p-4 grid gap-3 md:grid-cols-2">
              <h2 className="md:col-span-2 text-lg font-semibold">Selected Provider</h2>
              <p className="md:col-span-2 sv-subtitle">{provider.businessName} | {provider.location || "Unknown location"}</p>

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
                <option value="one-time">One-time</option>
                <option value="contract">Contract-based</option>
              </select>

              <input
                className="sv-input"
                type="date"
                min={new Date().toISOString().split("T")[0]}
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
              <button className="md:col-span-2 sv-btn">Confirm Booking</button>
            </form>

            <aside className="sv-card p-4 space-y-2">
              <h3 className="font-semibold">Booking Summary</h3>
              <p className="sv-subtitle">Base Price: Rs {selectedService?.price || provider.basePrice || 0}</p>
              <p className="sv-subtitle">Booking Charge: Rs {provider.bookingCharge || 0}</p>
              <p className="sv-subtitle">Consultation Fee: Rs {provider.consultationFee || 0}</p>
              <p className="sv-subtitle">Service Fee: Rs {provider.serviceFee || 0}</p>
              <hr style={{ borderColor: "var(--sv-border)" }} />
              <p style={{ fontWeight: 700 }}>
                Total: Rs {Number(selectedService?.price || provider.basePrice || 0) + Number(provider.bookingCharge || 0) + Number(provider.consultationFee || 0) + Number(provider.serviceFee || 0)}
              </p>
              <Link href={`/providers/${provider._id}`} className="sv-btn-secondary" style={{ display: "inline-block", textDecoration: "none" }}>
                Back To Provider
              </Link>
            </aside>
          </div>
        ) : null}

        {createdBooking ? (
          <div className="sv-card p-4 space-y-2">
            <p>Booking ID: {createdBooking._id}</p>
            <p>Status: {createdBooking.status}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/user/bookings" className="sv-btn" style={{ textDecoration: "none" }}>Go To My Bookings</Link>
              <Link href={`/providers/${providerId}`} className="sv-btn-secondary" style={{ textDecoration: "none" }}>Provider Details</Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
