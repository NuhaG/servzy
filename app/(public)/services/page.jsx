"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PublicServicesPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [search, setSearch]       = useState("")
  const [hovered, setHovered]     = useState(null)

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services")
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to load services")

        const map = new Map()
        for (const service of data) {
          const provider = service.providerId
          if (!provider?._id) continue
          const existing = map.get(provider._id)
          if (existing) {
            existing.services.push(service.title)
            continue
          }
          map.set(provider._id, {
            id:       provider._id,
            name:     provider.businessName,
            rating:   provider.avgRating || 0,
            location: provider.location || "India",
            photo:    service.images?.[0] || "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=500&fit=crop",
            services: [service.title],
          })
        }
        setProviders(Array.from(map.values()))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [])

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.services.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  )

  const stars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(rating) ? "#dc143c" : "#ddd", fontSize: 14 }}>★</span>
  ))

  return (
    <div style={{ minHeight: "100vh", background: "#f5ede3", fontFamily: "'Georgia',serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .warm-grad    { background: linear-gradient(135deg, #c94b2c, #dc143c); }
        .pcard { transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease; border-radius: 20px; overflow: hidden; background: white; border: 1px solid rgba(201,75,44,0.08); text-decoration: none; display: block; }
        .pcard:hover { transform: translateY(-8px); box-shadow: 0 24px 48px rgba(201,75,44,0.18), 0 8px 16px rgba(0,0,0,0.06); }
        .pcard:hover .card-img { transform: scale(1.06); }
        .card-img { transition: transform 0.5s cubic-bezier(0.23,1,0.32,1); }
        .search-input:focus { outline: none; border-color: rgba(201,75,44,0.4) !important; box-shadow: 0 0 0 3px rgba(201,75,44,0.1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease both; }
      `}</style>

      {/* NAVBAR */}
      <nav className="font-body" style={{ background: "rgba(245,237,227,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(201,75,44,0.12)", position: "sticky", top: 0, zIndex: 50, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div className="warm-grad" style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 16, fontFamily: "'Playfair Display',serif" }}>S</div>
          <span style={{ color: "#1a0a00", fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600 }}>Servzy</span>
        </Link>
        <Link href="/" className="font-body" style={{ color: "#c94b2c", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>← Back</Link>
      </nav>

      {/* PAGE HEADER */}
      <div style={{ textAlign: "center", padding: "52px 24px 36px" }}>
        <p className="font-body" style={{ fontSize: 11, fontWeight: 600, color: "#c94b2c", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Find your professional</p>
        <h1 className="font-display" style={{ fontSize: "clamp(2rem,4vw,3.2rem)", color: "#1a0a00", fontFamily: "'Playfair Display',serif", fontWeight: 700, marginBottom: 14 }}>Browse Services</h1>
        <p className="font-body" style={{ color: "#7a5a4a", fontSize: 15, maxWidth: 460, margin: "0 auto 32px" }}>
          Verified professionals ready to help — search by service, provider name, or location.
        </p>
        {/* Search */}
        <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
          <svg style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#c94b2c", width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search services or providers..." value={search} onChange={e => setSearch(e.target.value)} className="search-input font-body"
            style={{ width: "100%", padding: "14px 16px 14px 46px", borderRadius: 14, border: "1px solid rgba(201,75,44,0.18)", background: "white", fontSize: 14, color: "#1a0a00", transition: "border-color 0.2s, box-shadow 0.2s" }} />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="spinner" style={{ width: 40, height: 40, border: "3px solid rgba(201,75,44,0.15)", borderTop: "3px solid #c94b2c", borderRadius: "50%", margin: "0 auto 16px" }} />
            <p className="font-body" style={{ color: "#7a5a4a", fontSize: 14 }}>Finding professionals near you...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p className="font-body" style={{ color: "#c94b2c", fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{error}</p>
            <button onClick={() => window.location.reload()} className="font-body" style={{ padding: "10px 24px", background: "linear-gradient(135deg,#c94b2c,#dc143c)", color: "white", border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Try again</button>
          </div>
        )}

        {!loading && !error && (
          <p className="font-body" style={{ color: "#b08070", fontSize: 13, marginBottom: 20 }}>
            {filtered.length} provider{filtered.length !== 1 ? "s" : ""} found{search && ` for "${search}"`}
          </p>
        )}

        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
            {filtered.map((provider, i) => (
              <Link key={provider.id} href={`/providers/${provider.id}`} className="pcard fade-in" style={{ animationDelay: `${i * 0.06}s` }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                {/* Photo */}
                <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden" }}>
                  <Image src={provider.photo} alt={provider.name} width={800} height={500}
                    className="card-img"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(26,10,0,0.3) 0%,transparent 55%)" }} />
                  {provider.rating > 0 && (
                    <div className="font-body" style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#1a0a00", display: "flex", alignItems: "center", gap: 4, backdropFilter: "blur(8px)" }}>
                      <span style={{ color: "#dc143c" }}>★</span> {provider.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <h2 className="font-display" style={{ color: "#1a0a00", fontSize: 17, fontWeight: 700, fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>{provider.name}</h2>
                    <span style={{ color: "#c94b2c", fontSize: 18, opacity: hovered === i ? 1 : 0, transition: "opacity 0.2s", flexShrink: 0, marginLeft: 8 }}>→</span>
                  </div>

                  <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 5, color: "#7a5a4a", fontSize: 12, marginBottom: 10 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    {provider.location}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <div>{stars(provider.rating)}</div>
                    <span className="font-body" style={{ fontSize: 11, color: "#b08070" }}>
                      {provider.rating > 0 ? `${provider.rating.toFixed(1)} / 5` : "No ratings yet"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {provider.services.slice(0, 3).map((svc, j) => (
                      <span key={j} className="font-body" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(220,20,60,0.07)", color: "#c94b2c", border: "1px solid rgba(220,20,60,0.16)", fontWeight: 500 }}>{svc}</span>
                    ))}
                    {provider.services.length > 3 && (
                      <span className="font-body" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(201,75,44,0.06)", color: "#b08070" }}>+{provider.services.length - 3} more</span>
                    )}
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "linear-gradient(135deg,#c94b2c,#dc143c)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                    View Provider
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p className="font-display" style={{ color: "#1a0a00", fontSize: 20, fontFamily: "'Playfair Display',serif", fontWeight: 600, marginBottom: 8 }}>No results found</p>
            <p className="font-body" style={{ color: "#7a5a4a", fontSize: 14, marginBottom: 20 }}>Try searching for something else</p>
            <button onClick={() => setSearch("")} className="font-body" style={{ padding: "10px 24px", background: "linear-gradient(135deg,#c94b2c,#dc143c)", color: "white", border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Clear search</button>
          </div>
        )}
      </div>
    </div>
  )
}
