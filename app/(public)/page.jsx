"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"

// ── Real job-specific photos for each service ──
const SERVICE_PHOTOS = {
  // Pest control — white hazmat suit workers spraying indoors
  pest:       "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=450&fit=crop&q=80",
  // Deep home cleaning — person scrubbing / mopping floor
  cleaning:   "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=450&fit=crop&q=80",
  // Plumbing — hands tightening pipes under sink with wrench
  plumbing:   "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=450&fit=crop&q=80",
  // Gardening — person kneeling planting in a garden
  gardening:  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=450&fit=crop&q=80",
  // Electrician — working on electrical panel / switchboard
  electrical: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop&q=80",
  // Cooking / chef — preparing food in kitchen
  cooking:    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&h=450&fit=crop&q=80",
}

const Scene = ({ type }) => (
  <img
    src={SERVICE_PHOTOS[type] || SERVICE_PHOTOS.cleaning}
    alt={type}
    className="w-full h-full object-cover"
    style={{ display: "block" }}
  />
)

export default function ServzyLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeCategory, setActiveCategory] = useState(null)
  const [dark, setDark] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const t = {
    pageBg:     dark ? "#18100a" : "#f5ede3",
    sectionAlt: dark ? "#1f140c" : "#fdf6ee",
    cardBg:     dark ? "#2a1a10" : "#ffffff",
    navBg:      dark ? "rgba(24,16,10,0.92)" : "rgba(245,237,227,0.92)",
    navBorder:  dark ? "rgba(201,75,44,0.18)" : "rgba(201,75,44,0.12)",
    heading:    dark ? "#fde8d8" : "#1a0a00",
    body:       dark ? "#c4957a" : "#7a5a4a",
    muted:      dark ? "#8a5a44" : "#b08070",
    border:     dark ? "rgba(201,75,44,0.15)" : "rgba(201,75,44,0.08)",
    inputBg:    dark ? "#2a1a10" : "#ffffff",
    pillBg:     dark ? "rgba(220,20,60,0.15)" : "rgba(220,20,60,0.07)",
    footerBg:   dark ? "#0e0804" : "#120600",
  }

  const services = [
    { name: "Pest Control",   emoji: "🛡️", type: "pest",       iconBg: "from-lime-400 to-green-500" },
    { name: "Home Cleaning",  emoji: "✨",  type: "cleaning",   iconBg: "from-sky-400 to-blue-500" },
    { name: "Plumbing",       emoji: "🔧", type: "plumbing",   iconBg: "from-cyan-400 to-teal-500" },
    { name: "Gardening",      emoji: "🌿", type: "gardening",  iconBg: "from-green-400 to-emerald-500" },
    { name: "Electrician",    emoji: "⚡", type: "electrical", iconBg: "from-amber-400 to-orange-500" },
    { name: "Cooking",        emoji: "🍳", type: "cooking",    iconBg: "from-orange-400 to-red-400" },
  ]

  const featuredServices = [
    { title: "Deep Home Cleaning", provider: "CleanPro Services",   rating: 4.9, reviews: 234, price: "₹799", unit: "/ session", type: "cleaning",   badge: "Best Seller",   badgeColor: "#1565c0" },
    { title: "Pipe Repair",        provider: "AquaFix Plumbers",    rating: 4.8, reviews: 189, price: "₹499", unit: "/ visit",   type: "plumbing",   badge: "Fast Response", badgeColor: "#0f766e" },
    { title: "Home Cook",          provider: "TastyMeals Co.",      rating: 4.8, reviews: 143, price: "₹449", unit: "/ meal",    type: "cooking",    badge: "New",           badgeColor: "#7b1fa2" },
  ]

  const testimonials = [
    { name: "Priya Sharma",  role: "Homeowner, Mumbai",       text: "Servzy transformed my home! The cleaning team was incredibly thorough and professional. Will definitely book again.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop" },
    { name: "Rajesh Kumar",  role: "Property Manager, Delhi", text: "Managing 12 properties is now effortless. Servzy's providers are consistent, reliable, and always on time.",         img: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=100&h=100&fit=crop" },
    { name: "Anjali Desai",  role: "Business Owner, Pune",    text: "Booked an electrician at 8pm and they arrived within the hour. Absolutely incredible service and fair pricing!",     img: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop" },
  ]

  const stats = [
    { value: "50K+", label: "Happy Customers",   icon: "😊" },
    { value: "2K+",  label: "Verified Providers", icon: "✅" },
    { value: "4.9★", label: "Average Rating",     icon: "⭐" },
    { value: "15+",  label: "Service Categories", icon: "🛠️" },
  ]

  return (
    <div style={{ background: t.pageBg, fontFamily: "'Georgia', serif", transition: "background 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .warm-grad    { background: linear-gradient(135deg, #c94b2c 0%, #e8621a 50%, #dc143c 100%); }
        .warm-text    { background: linear-gradient(135deg, #c94b2c, #dc143c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .card-3d { transform-style: preserve-3d; transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease; }
        .card-3d:hover { transform: translateY(-12px) rotateX(4deg) rotateY(-2deg); box-shadow: 0 30px 60px rgba(201,75,44,0.22), 0 10px 20px rgba(0,0,0,0.08); }
        .floating        { animation: float 6s ease-in-out infinite; }
        .floating-delay  { animation: float 6s ease-in-out infinite 2s; }
        .floating-delay2 { animation: float 6s ease-in-out infinite 4s; }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);} 33%{transform:translateY(-12px) rotate(1deg);} 66%{transform:translateY(-6px) rotate(-1deg);} }
        .slide-up { animation: slideUp 0.8s cubic-bezier(0.23,1,0.32,1) both; }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px);} to{opacity:1;transform:translateY(0);} }
        .star { color: #dc143c; }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); }
        .pcard { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .pcard:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(201,75,44,0.15); }
        .nav-link::after { content:''; display:block; height:2px; width:0; background:linear-gradient(90deg,#c94b2c,#dc143c); transition:width 0.3s ease; border-radius:2px; }
        .nav-link:hover::after { width:100%; }
        .tog-track { width:46px; height:26px; border-radius:13px; position:relative; cursor:pointer; transition: background 0.3s ease; border:none; outline:none; }
        .tog-thumb { width:20px; height:20px; border-radius:50%; position:absolute; top:3px; transition: left 0.3s ease; pointer-events:none; }
        .tog-icon  { position:absolute; top:50%; transform:translateY(-50%); font-size:11px; pointer-events:none; user-select:none; line-height:1; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .svc-scene { transition: transform 0.5s cubic-bezier(0.23,1,0.32,1); }
        .svc-card:hover .svc-scene { transform: scale(1.04); }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="font-body sticky top-0 z-50 border-b" style={{ background: t.navBg, backdropFilter: "blur(20px)", borderColor: t.navBorder, transition: "background 0.3s" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl warm-grad flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ fontFamily: "'Playfair Display',serif" }}>S</div>
            <span className="text-xl font-semibold" style={{ color: t.heading, fontFamily: "'Playfair Display',serif", transition: "color 0.3s" }}>Servzy</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[["Services","/services"],["Provider Dashboard","/provider/dashboard"],["User Dashboard","/user/dashboard"]].map(([label,href])=>(
              <Link key={label} href={href} className="nav-link text-sm font-medium" style={{ color: t.body, transition: "color 0.3s" }}>{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={()=>setDark(d=>!d)} aria-label="Toggle dark mode" className="tog-track" style={{ background: dark ? "#c94b2c" : "rgba(201,75,44,0.15)" }}>
              <div className="tog-thumb" style={{ left: dark?"23px":"3px", background: dark?"#fff":"#c94b2c" }} />
              <span className="tog-icon" style={{ left:dark?"5px":"auto", right:dark?"auto":"5px" }}>{dark?"🌙":"☀️"}</span>
            </button>
            {/* Admin icon — only visible to admins (role check done on the admin page itself) */}
            <Link href="/admin/dashboard" aria-label="Admin panel" title="Admin Panel"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background:"rgba(201,75,44,0.1)", border:"1px solid rgba(201,75,44,0.2)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c94b2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </Link>
            <Link href="/sign-in" className="font-body text-sm font-medium px-4 py-2 rounded-lg" style={{ color:"#c94b2c" }}>Sign In</Link>
            <Link href="/sign-up" className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5" style={{ background:"linear-gradient(135deg,#c94b2c,#dc143c)", boxShadow:"0 4px 15px rgba(201,75,44,0.35)" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-6 py-20 overflow-hidden noise" style={{ background: t.pageBg }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.18]" style={{ background:"radial-gradient(circle,#c94b2c 0%,transparent 70%)", transform:`translate(${mousePosition.x*0.4}px,${mousePosition.y*0.4}px)` }} />
          <div className="absolute -bottom-40 -right-32 w-[700px] h-[700px] rounded-full opacity-[0.13]" style={{ background:"radial-gradient(circle,#dc143c 0%,transparent 70%)", transform:`translate(${mousePosition.x*-0.3}px,${mousePosition.y*-0.3}px)` }} />
        </div>
        <div className="absolute top-24 right-16 floating opacity-40">
          <div className="w-14 h-14 rounded-2xl rotate-12 shadow-xl" style={{ background:"linear-gradient(135deg,#c94b2c,#dc143c)" }} />
        </div>
        <div className="absolute bottom-32 left-24 floating-delay opacity-25">
          <div className="w-10 h-10 rounded-full shadow-lg" style={{ background:"linear-gradient(135deg,#dc143c,#c94b2c)" }} />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 slide-up">
              <h1 className="font-display leading-tight" style={{ fontSize:"clamp(2.8rem,5vw,4.5rem)", color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>
                Your Home,{" "}<span className="warm-text">Perfectly</span><br /><span className="warm-text">Serviced</span>
              </h1>
              <p className="font-body text-lg leading-relaxed max-w-md" style={{ color:t.body, transition:"color 0.3s" }}>
                Connect with verified professionals for cleaning, repairs, plumbing, and 15+ other services. Book in 60 seconds, guaranteed quality.
              </p>
              <div className="flex gap-2 p-2 rounded-2xl shadow-xl max-w-lg" style={{ background:t.inputBg, border:`1px solid ${t.border}`, transition:"background 0.3s" }}>
                <div className="flex-1 flex items-center gap-3 px-3">
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color:"#c94b2c" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="What service do you need?" className="font-body w-full text-sm outline-none bg-transparent" style={{ color:t.heading }} />
                </div>
                <Link href="/services" className="font-body px-5 py-3 rounded-xl text-white text-sm font-semibold flex-shrink-0 transition-all hover:-translate-y-0.5" style={{ background:"linear-gradient(135deg,#c94b2c,#dc143c)" }}>Search</Link>
              </div>
            </div>

            {/* Right 3D illustrated scene */}
            <div className="relative h-[520px] hidden lg:block" style={{ perspective:"1200px" }}>
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                style={{ transform:`rotateY(${mousePosition.x*0.06}deg) rotateX(${mousePosition.y*-0.06}deg)`, transformStyle:"preserve-3d", transition:"transform 0.3s ease", boxShadow:"0 40px 80px rgba(201,75,44,0.25),0 15px 30px rgba(0,0,0,0.1)" }}>
                <img src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop&q=85" alt="Beautiful clean home interior" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(26,10,0,0.5) 0%,transparent 55%)" }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-body text-white text-sm font-medium opacity-75">Featured service</p>
                  <p className="font-display text-white text-xl font-bold" style={{ fontFamily:"'Playfair Display',serif" }}>Professional Home Cleaning</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-10 bg-white rounded-2xl p-4 shadow-2xl z-10 floating" style={{ border:"1px solid rgba(201,75,44,0.12)", minWidth:"200px" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=80&h=80&fit=crop" className="w-full h-full object-cover" alt="provider" />
                  </div>
                  <div>
                    <p className="font-body text-xs font-semibold" style={{ color:"#1a0a00" }}>Booking confirmed!</p>
                    <p className="font-body text-xs" style={{ color:"#7a5a4a" }}>Today, 3:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">{[1,2,3,4,5].map(s=><span key={s} className="star text-xs">★</span>)}<span className="font-body text-xs ml-1" style={{ color:"#7a5a4a" }}>4.9 rating</span></div>
              </div>
              <div className="absolute -top-4 -right-8 bg-white rounded-2xl p-4 shadow-2xl z-10 floating-delay" style={{ border:"1px solid rgba(201,75,44,0.12)" }}>
                <div className="text-2xl mb-1">🏆</div>
                <p className="font-body text-xs" style={{ color:"#7a5a4a" }}>This month</p>
                <p className="font-body text-sm font-bold" style={{ color:"#c94b2c" }}>50K+ bookings</p>
              </div>
              <div className="absolute top-1/2 -right-6 bg-white rounded-2xl px-4 py-3 shadow-2xl z-10 floating-delay2" style={{ border:"1px solid rgba(201,75,44,0.12)" }}>
                <div className="flex -space-x-2 mb-2">
                  {["photo-1573496359142-b8d87734a5a2","photo-1566753323558-f4e0952af115","photo-1594744803329-e58b31de8bf5"].map((id,i)=>(
                    <div key={i} className="w-7 h-7 rounded-full overflow-hidden border-2 border-white"><img src={`https://images.unsplash.com/${id}?w=60&h=60&fit=crop`} className="w-full h-full object-cover" alt="p" /></div>
                  ))}
                </div>
                <p className="font-body text-xs font-semibold" style={{ color:"#1a0a00" }}>2,400+ pros</p>
                <p className="font-body text-xs" style={{ color:"#7a5a4a" }}>near you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 px-6" style={{ background:"linear-gradient(135deg,#c94b2c 0%,#e8621a 50%,#dc143c 100%)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s,i)=>(
            <div key={i} className="text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl font-bold text-white" style={{ fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              <div className="font-body text-sm text-white/80 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES (illustrated) ── */}
      <section className="py-24 px-6 noise" style={{ background: t.pageBg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm font-medium mb-3 uppercase tracking-widest" style={{ color:"#c94b2c" }}>Browse by category</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-4" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>Every Service You Need</h2>
            <p className="font-body text-lg max-w-xl mx-auto" style={{ color:t.body }}>From everyday maintenance to specialized repairs — all in one place</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((svc,i)=>(
              <Link key={i} href="/services"
                className="group relative rounded-xl overflow-hidden cursor-pointer card-3d"
                style={{ aspectRatio:"1/1", background: t.cardBg, border:`1px solid ${t.border}` }}
                onMouseEnter={()=>setActiveCategory(i)} onMouseLeave={()=>setActiveCategory(null)}
              >
                {/* Illustrated scene fills the card */}
                <div className="svc-scene absolute inset-0">
                  <Scene type={svc.type} />
                </div>
                {/* Icon badge top-right */}
                <div className={`absolute top-3 right-3 w-10 h-10 bg-gradient-to-br ${svc.iconBg} rounded-xl flex items-center justify-center shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <span className="text-base">{svc.emoji}</span>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 transition-opacity duration-300 z-[5]" style={{ background:"linear-gradient(to top,rgba(26,10,0,0.72) 0%,rgba(26,10,0,0.05) 60%)", opacity: activeCategory===i ? 1 : 0.6 }} />
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 pb-4 text-center z-10">
                  <span className="font-body text-white font-semibold text-sm drop-shadow">{svc.name}</span>
                  <div className="font-body text-white/60 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Browse →</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="font-body inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-xl" style={{ background:"linear-gradient(135deg,#c94b2c,#dc143c)", color:"white", boxShadow:"0 6px 20px rgba(201,75,44,0.35)" }}>
              <span>View all 20+ services</span>
              <span style={{ fontSize:18 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED SERVICES (illustrated) ── */}
      <section className="py-24 px-6" style={{ background: t.sectionAlt }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="font-body text-sm font-medium mb-3 uppercase tracking-widest" style={{ color:"#c94b2c" }}>Top picks</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>Featured Services</h2>
            </div>
            <Link href="/services" className="font-body text-sm font-semibold hidden md:flex items-center gap-2 transition-all hover:gap-3" style={{ color:"#c94b2c" }}>View all <span>→</span></Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredServices.map((svc,i)=>(
              <Link href="/services" key={i} className="svc-card card-3d rounded-2xl overflow-hidden cursor-pointer" style={{ background:t.cardBg, border:`1px solid ${t.border}`, transition:"background 0.3s" }}>
                <div className="relative overflow-hidden" style={{ aspectRatio:"4/3" }}>
                  <div className="svc-scene absolute inset-0">
                    <Scene type={svc.type} />
                  </div>
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(26,10,0,0.35) 0%,transparent 60%)" }} />
                  <span className="absolute top-3 left-3 font-body text-xs font-bold text-white px-3 py-1 rounded-full z-10" style={{ background:svc.badgeColor }}>{svc.badge}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-base mb-1" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>{svc.title}</h3>
                  <p className="font-body text-xs mb-3" style={{ color:t.body }}>{svc.provider}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="star text-sm">★</span>
                      <span className="font-body text-xs font-semibold" style={{ color:t.heading }}>{svc.rating}</span>
                      <span className="font-body text-xs" style={{ color:t.muted }}>({svc.reviews})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-body font-bold text-base" style={{ color:"#c94b2c" }}>{svc.price}</span>
                      <span className="font-body text-xs" style={{ color:t.muted }}>{svc.unit}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 noise" style={{ background: t.pageBg }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm font-medium mb-3 uppercase tracking-widest" style={{ color:"#c94b2c" }}>Simple process</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>Book in 3 Easy Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5" style={{ background:"linear-gradient(90deg,#c94b2c,#dc143c)" }} />
            {[
              { step:"01", title:"Choose a Service",  desc:"Browse 200+ services or search for what you need",    img:"https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop&q=80", icon:"🔍" },
              { step:"02", title:"Pick a Provider",   desc:"Compare verified pros by ratings, reviews, and price", img:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&q=80", icon:"👤" },
              { step:"03", title:"Sit Back & Relax",  desc:"Your pro arrives on time, job done to perfection",     img:"https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop&q=80", icon:"✅" },
            ].map((step,i)=>(
              <div key={i} className="card-3d rounded-3xl overflow-hidden" style={{ background:t.cardBg, border:`1px solid ${t.border}`, boxShadow:"0 8px 30px rgba(201,75,44,0.07)", transition:"background 0.3s" }}>
                <div className="relative overflow-hidden" style={{ aspectRatio:"4/3" }}>
                  <img src={step.img} alt={step.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(26,10,0,0.5),transparent)" }} />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center text-xl z-10" style={{ background:"rgba(201,75,44,0.9)" }}>{step.icon}</div>
                </div>
                <div className="p-6">
                  <div className="font-body text-xs font-bold mb-2 uppercase tracking-widest" style={{ color:"#c94b2c" }}>Step {step.step}</div>
                  <h3 className="font-display font-bold text-xl mb-2" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>{step.title}</h3>
                  <p className="font-body text-sm" style={{ color:t.body }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVIDER CTA ── */}
      <section className="py-24 px-6" style={{ background: t.sectionAlt }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          <div className="relative rounded-3xl overflow-hidden p-10 text-white" style={{ background:"linear-gradient(135deg,#c94b2c 0%,#e8621a 60%,#dc143c 100%)", minHeight:"400px" }}>
            <div className="absolute inset-0 noise" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10" style={{ background:"white" }} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10" style={{ background:"white" }} />
            <div className="relative z-10">
              <div className="text-5xl mb-6">👷</div>
              <h3 className="font-display text-3xl font-bold mb-4" style={{ fontFamily:"'Playfair Display',serif" }}>Become a Provider</h3>
              <p className="font-body text-white/85 text-lg mb-8 max-w-sm">Earn ₹50K+ monthly. Set your own hours. Join 2,000+ professionals already on Servzy.</p>
              <div className="space-y-3 mb-8">
                {["Instant payouts","Flexible scheduling","Free training & tools"].map(item=>(
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><span className="text-xs">✓</span></div>
                    <span className="font-body text-sm text-white/90">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" className="font-body inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 hover:shadow-xl" style={{ background:"white", color:"#c94b2c" }}>Apply Now <span>→</span></Link>
            </div>
          </div>
          {/* Provider collage — illustrated scenes grid */}
          <div className="grid grid-cols-2 gap-2 rounded-3xl overflow-hidden" style={{ minHeight:"400px" }}>
            {[
              { type:"plumbing",   src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80" },
              { type:"electrical", src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80" },
              { type:"moving",     src:"https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop&q=80" },
              { type:"carpentry",  src:"https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=400&h=300&fit=crop&q=80" },
            ].map((item,i)=>(
              <div key={i} className="relative overflow-hidden" style={{ minHeight:180 }}>
                <img src={item.src} alt={item.type} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" style={{ minHeight:180 }} />
                <div className="absolute inset-0" style={{ background:"rgba(26,10,0,0.15)" }} />
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position:"absolute" }}>
              <div className="floating text-center px-8 py-6 rounded-2xl" style={{ background:"rgba(255,255,255,0.96)", backdropFilter:"blur(12px)", border:"1px solid rgba(201,75,44,0.18)", boxShadow:"0 24px 64px rgba(26,10,0,0.28), 0 4px 20px rgba(201,75,44,0.18)" }}>
                <div className="font-display text-4xl font-bold mb-1" style={{ fontFamily:"'Playfair Display',serif", color:"#dc143c" }}>2,400+</div>
                <div className="font-body text-base font-semibold" style={{ color:"#dc143c" }}>Verified Professionals</div>
                <div className="font-body text-xs mt-1" style={{ color:"#b08070" }}>Across 50+ cities in India</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 noise" style={{ background: t.pageBg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm font-medium mb-3 uppercase tracking-widest" style={{ color:"#c94b2c" }}>Real stories</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold" style={{ color:t.heading, fontFamily:"'Playfair Display',serif", transition:"color 0.3s" }}>Loved by Thousands</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((tm,i)=>(
              <div key={i} className="pcard rounded-3xl p-8" style={{ background:t.cardBg, border:`1px solid ${t.border}`, boxShadow:"0 8px 30px rgba(201,75,44,0.06)", transition:"background 0.3s" }}>
                <div className="flex gap-1 mb-6">{[1,2,3,4,5].map(s=><span key={s} className="star text-lg">★</span>)}</div>
                <p className="font-body text-base leading-relaxed mb-8" style={{ color:t.body }}>&ldquo;{tm.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor:"rgba(201,75,44,0.2)" }}>
                    <img src={tm.img} alt={tm.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-body font-bold text-sm" style={{ color:t.heading }}>{tm.name}</div>
                    <div className="font-body text-xs" style={{ color:t.muted }}>{tm.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#1a0a00" }}>
        <div className="absolute inset-0" style={{ background:"linear-gradient(135deg,rgba(201,75,44,0.65) 0%,rgba(26,10,0,0.85) 100%)" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily:"'Playfair Display',serif" }}>Ready to Experience<br />the Difference?</h2>
          <p className="font-body text-lg text-white/75 mb-10 max-w-lg mx-auto">Join 50,000+ happy customers who trust Servzy for all their home service needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/services" className="font-body inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 hover:shadow-2xl text-base" style={{ background:"linear-gradient(135deg,#c94b2c,#dc143c)", color:"white", boxShadow:"0 8px 30px rgba(201,75,44,0.45)" }}>Book a Service <span>→</span></Link>
            <Link href="/sign-up" className="font-body inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 text-base" style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"2px solid rgba(255,255,255,0.3)", backdropFilter:"blur(10px)" }}>Sign Up Free</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 px-6" style={{ background: t.footerBg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold warm-grad">S</div>
                <span className="font-display text-xl font-bold text-white" style={{ fontFamily:"'Playfair Display',serif" }}>Servzy</span>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color:"#8a6050" }}>India&apos;s trusted home services platform connecting customers with verified professionals.</p>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold mb-5 uppercase tracking-widest" style={{ color:"#dc143c" }}>Services</h4>
              <ul className="space-y-3">{["Cleaning","Plumbing","Electrical","Carpentry","Gardening"].map(s=><li key={s}><Link href="/services" className="font-body text-sm transition-colors hover:text-white" style={{ color:"#8a6050" }}>{s}</Link></li>)}</ul>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold mb-5 uppercase tracking-widest" style={{ color:"#dc143c" }}>Company</h4>
              <ul className="space-y-3">{[["About Us","/"],["Privacy Policy","/"],["Terms","/"],["Careers","/"]].map(([l,h])=><li key={l}><Link href={h} className="font-body text-sm transition-colors hover:text-white" style={{ color:"#8a6050" }}>{l}</Link></li>)}</ul>
            </div>
            <div>
              <h4 className="font-body text-sm font-bold mb-5 uppercase tracking-widest" style={{ color:"#dc143c" }}>Contact</h4>
              <ul className="space-y-4 font-body text-sm" style={{ color:"#8a6050" }}>
                <li className="flex items-center gap-2"><span>✉</span><a href="mailto:hello@servzy.com" className="hover:text-white transition-colors">hello@servzy.com</a></li>
                <li className="flex items-center gap-2"><span>📞</span><a href="tel:+911800123456" className="hover:text-white transition-colors">+91 1800-123-456</a></li>
                <li className="flex items-center gap-2"><span>📍</span><span>Mumbai, India</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop:"1px solid rgba(138,96,80,0.2)" }}>
            <p className="font-body text-xs" style={{ color:"#5a3a2a" }}>© 2024 Servzy. All rights reserved.</p>
            <div className="flex gap-3">
              {["f","𝕏","in","ig"].map(icon=><a key={icon} href="#" className="w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all hover:-translate-y-1 font-body" style={{ background:"rgba(138,96,80,0.15)", color:"#8a6050" }}>{icon}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
