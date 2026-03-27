"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function routeByRole() {
      try {
        const requestedRole = searchParams.get("role");
        if (requestedRole === "user" || requestedRole === "provider") {
          await fetch("/api/me/role", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: requestedRole }),
          });
        }

        const response = await fetch("/api/me");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to resolve account");

        const role = data.user?.role || "user";
        if (role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (role === "provider") {
          router.replace("/provider/dashboard");
          return;
        }
        router.replace("/user/dashboard");
      } catch (err) {
        setError(err.message);
      }
    }

    routeByRole();
  }, [router, searchParams]);

  return (
    <main className="sv-page">
      <div className="sv-shell">
        <div className="sv-card p-6">
          <p className="sv-subtitle">Finishing sign-in...</p>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}
