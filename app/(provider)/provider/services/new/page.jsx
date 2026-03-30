"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function NewServicePage() {
  const [providerId, setProviderId] = useState("");
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    priceUnit: "per_job",
    images: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProviderId() {
      try {
        setLoadingProvider(true);
        const response = await fetch("/api/me");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load account");
        if (!data.provider?._id) throw new Error("Provider profile not found for this account");
        setProviderId(data.provider._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProvider(false);
      }
    }
    loadProviderId();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      setIsCreating(true);
      const payload = {
        providerId,
        ...form,
        price: Number(form.price),
        images: form.images.split(",").map((item) => item.trim()).filter(Boolean),
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create service");
      setMessage(`Service "${data.title}" created successfully.`);
      setForm({
        title: "",
        description: "",
        category: "",
        price: "",
        priceUnit: "per_job",
        images: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell">
      <form onSubmit={handleSubmit} className="sv-card mx-auto max-w-3xl space-y-3 p-6">
        <h1 className="sv-title">Create Service</h1>
        {loadingProvider ? <p className="sv-subtitle">Checking provider account...</p> : null}
        {providerId && !loadingProvider ? <p className="sv-subtitle">Provider connected</p> : null}
        <input className="sv-input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={isCreating || loadingProvider} />
        <textarea className="sv-input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isCreating || loadingProvider} />
        <input className="sv-input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isCreating || loadingProvider} />
        <input className="sv-input" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required disabled={isCreating || loadingProvider} />
        <select className="sv-input" value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })} disabled={isCreating || loadingProvider}>
          <option value="per_hour">per_hour</option>
          <option value="per_job">per_job</option>
          <option value="per_day">per_day</option>
        </select>
        <input className="sv-input" placeholder="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} disabled={isCreating || loadingProvider} />
        <button className="sv-btn" disabled={!providerId || isCreating || loadingProvider}>
          {isCreating ? "Creating service..." : "Create Service"}
        </button>
        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </form>
      </div>
    </main>
  );
}
