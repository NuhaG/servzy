"use client";

import { useState } from "react";

export default function NewServicePage() {
  const [form, setForm] = useState({
    providerId: "",
    title: "",
    description: "",
    category: "",
    price: "",
    priceUnit: "per_job",
    images: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        images: form.images
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create service");
      setMessage(`Service created: ${data._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-3 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Create Service</h1>
        <input
          className="w-full rounded border p-2"
          placeholder="Provider ID"
          value={form.providerId}
          onChange={(e) => setForm({ ...form, providerId: e.target.value })}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded border p-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <select
          className="w-full rounded border p-2"
          value={form.priceUnit}
          onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
        >
          <option value="per_hour">per_hour</option>
          <option value="per_job">per_job</option>
          <option value="per_day">per_day</option>
        </select>
        <input
          className="w-full rounded border p-2"
          placeholder="Image URLs (comma separated)"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Create</button>
        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}
