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

        // Ensure DB user exists first for brand new sign-ups.
        const firstMeResponse = await fetch("/api/me");
        const firstMeData = await firstMeResponse.json();
        if (!firstMeResponse.ok) throw new Error(firstMeData.error || "Failed to resolve account");

        const currentRole = firstMeData.user?.role || "user";
        if ((requestedRole === "user" || requestedRole === "provider") && currentRole !== "admin" && currentRole !== requestedRole) {
          const roleResponse = await fetch("/api/me/role", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: requestedRole }),
          });
          const roleData = await roleResponse.json();
          if (!roleResponse.ok) throw new Error(roleData.error || "Failed to update role");
        }

        let response = await fetch("/api/me");
        let data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to resolve account");

        // Bootstrap provider profile once when account role is provider.
        if (data.user?.role === "provider" && !data.provider?._id) {
          const createProviderResponse = await fetch("/api/providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: data.user?.name ? `${data.user.name} Services` : "Provider Services",
            }),
          });

          if (!createProviderResponse.ok) {
            const providerError = await createProviderResponse.json().catch(() => ({}));
            const msg = providerError.error || "Failed to create provider profile";
            // Ignore only if already created in a parallel request.
            if (!String(msg).toLowerCase().includes("already exists")) {
              throw new Error(msg);
            }
          }

          response = await fetch("/api/me");
          data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to refresh account");
        }

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
