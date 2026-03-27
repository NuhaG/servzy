"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function EditServicePage() {
  const { serviceId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    priceUnit: "per_job",
    images: "",
    isActive: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadService() {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load service");
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          price: String(data.price ?? ""),
          priceUnit: data.priceUnit || "per_job",
          images: (data.images || []).join(", "),
          isActive: Boolean(data.isActive),
        });
      } catch (err) {
        setError(err.message);
      }
    }

    if (serviceId) loadService();
  }, [serviceId]);

  async function saveService(event) {
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

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update service");
      setMessage(`Service updated: ${data._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteService() {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete service");
      router.push("/provider/services");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell">
      <form onSubmit={saveService} className="sv-card mx-auto max-w-3xl space-y-3 p-6">
        <h1 className="sv-title">Edit Service</h1>
        <input
          className="sv-input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="sv-input"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="sv-input"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="sv-input"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="sv-input"
          placeholder="Image URLs (comma separated)"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <div className="flex gap-2">
          <button className="sv-btn">Save</button>
          <button
            type="button"
            onClick={deleteService}
            className="rounded bg-red-700 px-4 py-2 text-white"
          >
            Delete
          </button>
        </div>
        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </form>
      </div>
    </main>
  );
}
