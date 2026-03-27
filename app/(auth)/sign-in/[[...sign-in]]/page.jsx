import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .warm-grad    { background: linear-gradient(135deg, #c94b2c, #dc143c); }

        /* Clerk overrides */
        .cl-rootBox { width: 100% !important; }
        .cl-card {
          background: rgba(255,255,255,0.96) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(255,255,255,0.6) !important;
          border-radius: 24px !important;
          box-shadow: 0 32px 80px rgba(26,10,0,0.25), 0 8px 32px rgba(201,75,44,0.15) !important;
          font-family: 'DM Sans', sans-serif !important;
        }
        .cl-headerTitle {
          font-family: 'Playfair Display', serif !important;
          color: #1a0a00 !important;
          font-size: 1.6rem !important;
        }
        .cl-headerSubtitle { font-family: 'DM Sans', sans-serif !important; color: #7a5a4a !important; }
        .cl-formButtonPrimary {
          background: linear-gradient(135deg, #c94b2c, #dc143c) !important;
          border-radius: 12px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 15px rgba(201,75,44,0.4) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .cl-formButtonPrimary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(201,75,44,0.5) !important;
        }
        .cl-formFieldInput {
          border-radius: 10px !important;
          border-color: rgba(201,75,44,0.2) !important;
          background: rgba(255,255,255,0.9) !important;
          font-family: 'DM Sans', sans-serif !important;
          color: #1a0a00 !important;
        }
        .cl-formFieldInput:focus {
          border-color: #c94b2c !important;
          box-shadow: 0 0 0 3px rgba(201,75,44,0.12) !important;
          background: #fff !important;
        }
        .cl-footerActionLink  { color: #c94b2c !important; font-weight: 600 !important; font-family: 'DM Sans', sans-serif !important; }
        .cl-socialButtonsBlockButton { border-radius: 10px !important; border-color: rgba(201,75,44,0.18) !important; background: rgba(255,255,255,0.8) !important; font-family: 'DM Sans', sans-serif !important; }
        .cl-dividerLine  { background: rgba(201,75,44,0.15) !important; }
        .cl-dividerText  { color: #b08070 !important; font-family: 'DM Sans', sans-serif !important; }
        .cl-formFieldLabel { color: #7a5a4a !important; font-family: 'DM Sans', sans-serif !important; font-weight: 500 !important; }
        .cl-internal-b3fm6y { color: #c94b2c !important; }
        .cl-footer { background: rgba(255,255,255,0.96) !important; border-radius: 0 0 24px 24px !important; }
        .cl-footerPages { background: rgba(255,255,255,0.96) !important; }
      `}</style>

      {/* ── FULL BG IMAGE ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1600&h=1200&fit=crop&q=85"
          alt="background"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Warm red overlay — identical to sign-up */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(201,75,44,0.72) 0%, rgba(139,20,20,0.65) 50%, rgba(26,10,0,0.7) 100%)" }} />
      </div>

      {/* ── NAVBAR ── identical to sign-up, just link flipped */}
      <nav className="font-body" style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div className="warm-grad" style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 16, fontFamily: "'Playfair Display',serif", boxShadow: "0 4px 12px rgba(201,75,44,0.5)" }}>S</div>
          <span style={{ color: "white", fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600 }}>Servzy</span>
        </Link>
        <Link href="/sign-up" className="font-body" style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
          No account?{" "}
          <span style={{ color: "white", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>Sign up</span>
        </Link>
      </nav>

      {/* ── CENTERED CARD ── identical layout to sign-up */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {/* Tagline above card */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <p className="font-body" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>Welcome back</p>
            <h1 className="font-display" style={{ color: "white", fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, lineHeight: 1.2 }}>
              Your home is waiting.
            </h1>
          </div>

          {/* Translucent white Clerk card */}
          <SignIn
            forceRedirectUrl="/auth/complete"
            appearance={{
              variables: {
                colorPrimary:         "#c94b2c",
                colorText:            "#1a0a00",
                colorTextSecondary:   "#7a5a4a",
                colorBackground:      "rgba(255,255,255,0.96)",
                colorInputBackground: "rgba(255,255,255,0.9)",
                colorInputText:       "#1a0a00",
                borderRadius:         "12px",
                fontFamily:           "'DM Sans', sans-serif",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
