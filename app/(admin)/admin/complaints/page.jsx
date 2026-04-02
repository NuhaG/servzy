"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await fetch("/api/admin/complaints");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, internalNotes) => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, internalNotes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setComplaints((prev) => prev.map((c) => (c._id === id ? data : c)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-5">
        <div className="sv-card p-6">
          <h1 className="sv-title">Complaints Triage</h1>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        {loading ? (
          <p>Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p>No complaints found.</p>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="sv-card p-6">
                <div className="flex justify-between items-start mb-4">
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
                      User:{" "}
                      {complaint.userId?.name
                        ? `${complaint.userId.name} (${complaint.userId.email})`
                        : "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Filed:{" "}
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium capitalize ${complaint.status === "resolved" ? "text-green-600" : complaint.status === "in_review" ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {complaint.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {complaint.attachments.length > 0 && (
                  <div className="mb-4 flex space-x-2">
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

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium">
                      Internal Notes
                    </label>
                    <textarea
                      defaultValue={complaint.internalNotes || ""}
                      onBlur={(e) =>
                        updateStatus(
                          complaint._id,
                          complaint.status,
                          e.target.value,
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                      placeholder="Add internal notes..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateStatus(complaint._id, "open")}
                      disabled={updating === complaint._id}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Mark Open
                    </button>
                    <button
                      onClick={() => updateStatus(complaint._id, "in_review")}
                      disabled={updating === complaint._id}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      In Review
                    </button>
                    <button
                      onClick={() => updateStatus(complaint._id, "resolved")}
                      disabled={updating === complaint._id}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
