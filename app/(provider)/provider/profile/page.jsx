"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

export default function ProviderProfilePage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState("");
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    businessName: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok)
          throw new Error(meData.error || "Failed to load account");
        if (!meData.provider?._id)
          throw new Error("Provider profile not found");

        setProviderId(meData.provider._id);

        const providerResponse = await fetch(
          `/api/providers/${meData.provider._id}`,
        );
        const providerData = await providerResponse.json();
        if (!providerResponse.ok)
          throw new Error(providerData.error || "Failed to load provider");

        setProvider(providerData);
        setForm({
          businessName: providerData.businessName || "",
          bio: providerData.bio || "",
          location: providerData.location || "",
        });
        setPreview(providerData.photo || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("businessName", form.businessName);
      formData.append("bio", form.bio);
      formData.append("location", form.location);

      if (selectedFile) {
        formData.append("profilePic", selectedFile);
      }

      const response = await fetch(`/api/providers/${providerId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      setProvider(data);
      setSelectedFile(null);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="sv-page">
        <AppNav />
        <div className="sv-shell">
          <div className="sv-card p-6">
            <p className="sv-subtitle">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell">
        <form
          onSubmit={handleSubmit}
          className="sv-card mx-auto max-w-2xl space-y-6 p-6"
        >
          <div>
            <h1 className="sv-title">Edit Profile</h1>
            <p className="sv-subtitle mt-1">
              Update your business information and profile picture
            </p>
          </div>

          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* Profile Picture Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture (Optional)
            </label>
            <div className="flex items-center gap-6">
              {/* Preview */}
              <div className="shrink-0">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200">
                    <span className="text-xs text-gray-500">No image</span>
                  </div>
                )}
              </div>

              {/* Upload Input */}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isSaving}
                  className="sv-input cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
                {selectedFile && (
                  <p className="mt-2 text-xs text-blue-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              className="sv-input"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              disabled={isSaving}
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              className="sv-input"
              rows="4"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              disabled={isSaving}
              placeholder="Tell customers about your business..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              className="sv-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              disabled={isSaving}
              placeholder="Your business location"
            />
          </div>

          <button type="submit" disabled={isSaving} className="sv-btn w-full">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
