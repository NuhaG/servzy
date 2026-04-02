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
    serviceImages: [],
    isActive: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadService() {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to load service");
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          price: String(data.price ?? ""),
          priceUnit: data.priceUnit || "per_job",
          serviceImages: data.serviceImages || [],
          isActive: Boolean(data.isActive),
        });
      } catch (err) {
        setError(err.message);
      }
    }

    if (serviceId) loadService();
  }, [serviceId]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (form.serviceImages.length + files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      files.forEach((file) => formDataUpload.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        serviceImages: [...prev.serviceImages, ...data.urls],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      serviceImages: prev.serviceImages.filter((_, i) => i !== index),
    }));
  };

  async function saveService(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update service");
      setMessage(`Service updated: ${data._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteService() {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete service");
      router.push("/provider/services");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell">
        <form
          onSubmit={saveService}
          className="sv-card mx-auto max-w-3xl space-y-3 p-6"
        >
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
          <div>
            <label className="block text-sm font-medium mb-1">
              Service Images (up to 10)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="sv-input cursor-pointer"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
            {form.serviceImages.length > 0 && (
              <div className="mt-2 grid grid-cols-5 gap-2">
                {form.serviceImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt="service"
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
