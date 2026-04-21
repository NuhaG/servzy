"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-5">
        <div className="sv-card p-6">
          <h1 className="sv-title">Provider Complaints</h1>
          <p className="sv-subtitle mt-2">
            Anonymous user complaints filed against your services.
          </p>
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

                {complaint.attachments?.length > 0 && (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
