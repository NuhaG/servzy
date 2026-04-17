"use client";

import Link from "next/link";
import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

export default function AppNav() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [role, setRole] = useState("user");
  const [providerImage, setProviderImage] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    async function loadRole() {
      try {
        const response = await fetch("/api/me");
        if (!response.ok) return;
        const data = await response.json();
        setRole(data.user?.role || "user");

        // Load provider image if provider
        if (data.user?.role === "provider" && data.provider?._id) {
          const providerRes = await fetch(`/api/providers/${data.provider._id}`);
          if (providerRes.ok) {
            const providerData = await providerRes.json();
            setProviderImage(providerData?.avatarUrl || providerData?.photo || null);
          }
        }
      } catch (_) {
        // keep default role
      }
    }
    loadRole();
  }, []);

  const roleLinks = useMemo(() => {
    const links = [];

    if (role === "user") {
      links.push({ href: "/services", label: "Find Services" });
      links.push({ href: "/user/dashboard", label: "Dashboard" });
      links.push({ href: "/user/bookings", label: "My Bookings" });
    }

    if (role === "provider") {
      links.push({ href: "/provider/dashboard", label: "Dashboard" });
      links.push({ href: "/provider/bookings", label: "Bookings" });
    }

    if (role === "admin") {
      links.push({ href: "/admin/dashboard", label: "Admin" });
      links.push({ href: "/admin/providers", label: "Providers" });
      links.push({ href: "/admin/users", label: "Users" });
    }

    return links;
  }, [role]);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(245,237,227,0.96)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,75,44,0.16)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              background: "linear-gradient(135deg,#c94b2c,#dc143c)",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            S
          </span>
          <span style={{ color: "#1a0a00", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>Servzy</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isSignedIn ? (
            <>
              {roleLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    border: "1px solid rgba(201,75,44,0.22)",
                    color: "#1a0a00",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#fff",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <div style={{ marginLeft: 6 }}>
                {role === "provider" && providerImage ? (
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action label="manageAccount" />
                      <UserButton.Action label="signOut" />
                    </UserButton.MenuItems>
                  </UserButton>
                ) : (
                  <UserButton afterSignOutUrl="/" />
                )}
              </div>
            </>
          ) : null}

          {!isSignedIn ? (
            <>
              <Link href="/sign-in" style={{ textDecoration: "none", color: "#c94b2c", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}>
                Sign In
              </Link>
              <Link href="/sign-up" style={{ textDecoration: "none", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#c94b2c,#dc143c)" }}>
                Sign Up
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
