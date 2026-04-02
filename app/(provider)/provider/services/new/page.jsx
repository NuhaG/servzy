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
    serviceImages: [],
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProviderId() {
      try {
        setLoadingProvider(true);
        const response = await fetch("/api/me");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to load account");
        if (!data.provider?._id)
          throw new Error("Provider profile not found for this account");
        setProviderId(data.provider._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProvider(false);
      }
    }
    loadProviderId();
  }, []);

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
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create service");
      setMessage(`Service "${data.title}" created successfully.`);
      setForm({
        title: "",
        description: "",
        category: "",
        price: "",
        priceUnit: "per_job",
        serviceImages: [],
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
        <form
          onSubmit={handleSubmit}
          className="sv-card mx-auto max-w-3xl space-y-3 p-6"
        >
          <h1 className="sv-title">Create Service</h1>
          {loadingProvider ? (
            <p className="sv-subtitle">Checking provider account...</p>
          ) : null}
          {providerId && !loadingProvider ? (
            <p className="sv-subtitle">Provider connected</p>
          ) : null}
          <input
            className="sv-input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            disabled={isCreating || loadingProvider}
          />
          <textarea
            className="sv-input"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isCreating || loadingProvider}
          />
          <input
            className="sv-input"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={isCreating || loadingProvider}
          />
          <input
            className="sv-input"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            disabled={isCreating || loadingProvider}
          />
          <select
            className="sv-input"
            value={form.priceUnit}
            onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
            disabled={isCreating || loadingProvider}
          >
            <option value="per_hour">per_hour</option>
            <option value="per_job">per_job</option>
            <option value="per_day">per_day</option>
          </select>
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
              disabled={isCreating || loadingProvider || uploading}
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
          <button
            className="sv-btn"
            disabled={!providerId || isCreating || loadingProvider}
          >
            {isCreating ? "Creating service..." : "Create Service"}
          </button>
          {message ? <p className="text-green-700">{message}</p> : null}
          {error ? <p className="text-red-700">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
