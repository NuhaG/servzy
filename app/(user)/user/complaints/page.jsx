"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";

export default function UserComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [formData, setFormData] = useState({
    providerId: "",
    category: "",
    description: "",
    attachments: [],
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProviders();
    loadComplaints();
  }, []);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const response = await fetch("/api/providers");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to load providers");
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadComplaints = async () => {
    try {
      const response = await fetch("/api/complaints");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

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

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...data.urls],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.providerId) {
      setError("Please select a provider to file the complaint against.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setComplaints((prev) => [data, ...prev]);
      setFormData({ category: "", description: "", attachments: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-5">
        <div className="sv-card p-6">
          <h1 className="sv-title">File a Complaint</h1>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Provider</label>
              <select
                value={formData.providerId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    providerId: e.target.value,
                  }))
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option value="">Select provider</option>
                {providers.map((provider) => (
                  <option key={provider._id} value={provider._id}>
                    {provider.businessName}
                  </option>
                ))}
              </select>
              {providersLoading && (
                <p className="text-sm text-gray-500">Loading providers...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option value="">Select category</option>
                <option value="service_quality">Service Quality</option>
                <option value="provider_behavior">Provider Behavior</option>
                <option value="booking_issue">Booking Issue</option>
                <option value="payment_problem">Payment Problem</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Attachments (optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block"
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-blue-600">Uploading...</p>
              )}
              {formData.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.attachments.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <img
                        src={url}
                        alt="attachment"
                        className="w-16 h-16 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        </div>

        <div className="sv-card p-6">
          <h2 className="sv-title">Your Complaints</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : complaints.length === 0 ? (
            <p>No complaints filed yet.</p>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium capitalize">
                        {complaint.category.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {complaint.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Provider:{" "}
                        {complaint.providerId?.businessName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status:{" "}
                        <span
                          className={`capitalize ${complaint.status === "resolved" ? "text-green-600" : complaint.status === "in_review" ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Filed:{" "}
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {complaint.attachments.length > 0 && (
                    <div className="mt-2 flex space-x-2">
                      {complaint.attachments.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt="attachment"
                          className="w-16 h-16 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
