"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

function personImage(seed) {
  return `https://i.pravatar.cc/1000?u=${encodeURIComponent(seed || "provider")}`;
}

function ProviderDetailsContent() {
  const { providerId } = useParams();
  const searchParams = useSearchParams();
  const serviceIdFromQuery = searchParams.get("serviceId");
  const [provider, setProvider] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        setError("");
        const providerResponse = await fetch(`/api/providers/${providerId}`);
        const providerData = await providerResponse.json();
        if (!providerResponse.ok) throw new Error(providerData.error || "Failed to load provider");

        setProvider(providerData);

        // Optional account context: provider profile stays public even if user is signed out.
        try {
          const contextResponse = await fetch("/api/me");
          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            setCurrentUserId(contextData.user?._id || "");
          } else {
            setCurrentUserId("");
          }
        } catch (_) {
          setCurrentUserId("");
        }
      } catch (err) {
        setError(err.message);
      }
    }

    if (providerId) loadPageData();
  }, [providerId]);

  const selectedService = useMemo(
    () =>
      (provider?.services || []).find((service) => service._id === serviceIdFromQuery) ||
      (provider?.services || [])[0],
    [provider, serviceIdFromQuery]
  );
  const totalPrice = useMemo(
    () =>
      Number(selectedService?.price || provider?.basePrice || 0) +
      Number(provider?.bookingCharge || 0) +
      Number(provider?.consultationFee || 0) +
      Number(provider?.serviceFee || 0),
    [selectedService, provider]
  );

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
                <img
                  src={personImage(selectedService?._id || provider._id)}
                  alt={provider.businessName}
                  width={1000}
                  height={700}
                  className="h-72 w-full rounded object-cover"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <h1 className="text-2xl font-bold">{provider.businessName}</h1>
                <p className="text-sm text-slate-600">{provider.location}</p>
                <p className="text-sm">Selected Service: {selectedService?.title || "Service"}</p>
                <p style={{ color: "#c94b2c", fontWeight: 800, fontSize: 24 }}>
                  Rs {totalPrice}
                </p>
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
              <section className="sv-card p-4 space-y-3">
                <h2 className="text-lg font-semibold">Ready To Book?</h2>
                <p className="sv-subtitle">Continue to booking to choose service, date, and time.</p>
                {!currentUserId ? (
                  <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/book?providerId=${providerId}`)}`} className="sv-btn" style={{ display: "inline-block", textDecoration: "none" }}>
                    Sign In To Book
                  </Link>
                ) : (
                  <Link href={`/book?providerId=${providerId}&serviceId=${encodeURIComponent(selectedService?._id || "")}`} className="sv-btn" style={{ display: "inline-block", textDecoration: "none" }}>
                    Continue To Booking
                  </Link>
                )}
              </section>
              <aside className="sv-card p-4 space-y-3">
                <h3 className="font-semibold">Pricing Breakdown</h3>
                <p className="sv-subtitle">Base Price: Rs {selectedService?.price || provider.basePrice || 0}</p>
                <p className="sv-subtitle">Booking Charge: Rs {provider.bookingCharge || 0}</p>
                <p className="sv-subtitle">Consultation: Rs {provider.consultationFee || 0}</p>
                <p className="sv-subtitle">Service Fee: Rs {provider.serviceFee || 0}</p>
                <hr style={{ borderColor: "var(--sv-border)" }} />
                <p style={{ fontWeight: 700 }}>
                  Total: Rs {totalPrice}
                </p>
                <p className="sv-subtitle">Verified provider with live reliability scoring.</p>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function ProviderDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="sv-page">
          <AppNav />
          <div className="sv-shell">
            <div className="sv-card p-6">
              <p className="sv-subtitle">Loading provider details...</p>
            </div>
          </div>
        </main>
      }
    >
      <ProviderDetailsContent />
    </Suspense>
  );
}
