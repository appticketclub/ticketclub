import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HandleAuth from "@/components/HandleAuth";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" />

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #07060f; color: #f0eeff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; overflow-x: hidden; }

        /* Animated background */
        .bg-fixed { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(90px); }
        .blob1 { top: -10%; left: -5%; width: 55vw; height: 55vw; background: radial-gradient(circle, rgba(110,60,255,0.18) 0%, transparent 70%); animation: b1 20s ease-in-out infinite; }
        .blob2 { bottom: 5%; right: -10%; width: 45vw; height: 45vw; background: radial-gradient(circle, rgba(150,80,255,0.13) 0%, transparent 70%); animation: b2 25s ease-in-out infinite; }
        .blob3 { top: 40%; left: 25%; width: 35vw; height: 35vw; background: radial-gradient(circle, rgba(80,40,200,0.09) 0%, transparent 70%); animation: b3 30s ease-in-out infinite; }
        @keyframes b1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-70px) scale(1.12)} }
        @keyframes b2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,50px) scale(0.88)} }
        @keyframes b3 { 0%,100%{transform:translate(0,0) scale(1)} 60%{transform:translate(30px,-40px) scale(1.06)} }
        .bg-grid { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(123,108,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,108,246,0.04) 1px, transparent 1px); background-size: 60px 60px; }

        /* Nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1.1rem 4rem; display: flex; align-items: center; justify-content: space-between; background: rgba(7,6,15,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(123,108,246,0.1); }
        .nav-logo { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
        .logo-mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 800; color: #fff; box-shadow: 0 4px 14px rgba(123,108,246,0.4); }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-links a { color: rgba(240,238,255,0.6); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: #fff; }
        .nav-cta { display: flex; gap: 0.75rem; }
        .btn-ghost { padding: 7px 18px; background: transparent; border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; color: rgba(240,238,255,0.8); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.15s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .btn-nav-primary { padding: 7px 18px; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); border: none; border-radius: 9px; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; box-shadow: 0 3px 12px rgba(123,108,246,0.35); }

        /* Sections */
        section { position: relative; z-index: 1; }

        /* Hero */
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 2rem 4rem; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(123,108,246,0.1); border: 1px solid rgba(123,108,246,0.25); border-radius: 100px; font-size: 12px; color: rgba(240,238,255,0.7); margin-bottom: 2rem; letter-spacing: 0.06em; }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #7b6cf6; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(3rem, 7vw, 6.5rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 1.5rem; color: #fff; }
        .chrome { background: linear-gradient(135deg, #7b6cf6 0%, #a89df7 50%, #c4baff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero p { font-size: clamp(1rem, 1.8vw, 1.2rem); color: rgba(240,238,255,0.5); max-width: 560px; line-height: 1.75; margin-bottom: 3rem; }
        .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-hero { padding: 1rem 2.5rem; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; text-decoration: none; box-shadow: 0 6px 28px rgba(123,108,246,0.45); letter-spacing: 0.02em; }
        .btn-hero-ghost { padding: 1rem 2.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; color: rgba(240,238,255,0.8); font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.15s; }
        .btn-hero-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #fff; }
        .hero-stats { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .stat-pill { display: flex; align-items: center; gap: 0.5rem; padding: 8px 16px; background: rgba(16,14,26,0.8); border: 1px solid rgba(123,108,246,0.15); border-radius: 100px; backdrop-filter: blur(10px); font-size: 13px; color: rgba(240,238,255,0.6); }
        .stat-pill strong { color: #5de8a0; font-weight: 700; }

        /* Features */
        .features { padding: 7rem 2rem; display: flex; flex-direction: column; align-items: center; }
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(123,108,246,0.8); margin-bottom: 1rem; }
        .section-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem; text-align: center; color: #fff; }
        .section-sub { font-size: 1.05rem; color: rgba(240,238,255,0.4); max-width: 480px; line-height: 1.7; margin-bottom: 4rem; text-align: center; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; width: 100%; max-width: 1100px; }
        .feature-card { background: linear-gradient(145deg, rgba(28,26,42,0.85), rgba(18,16,30,0.9)); border: 1px solid rgba(123,108,246,0.12); border-radius: 20px; padding: 1.75rem; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s; backdrop-filter: blur(12px); }
        .feature-card:hover { border-color: rgba(123,108,246,0.3); transform: translateY(-3px); }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(123,108,246,0.3), transparent); }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(123,108,246,0.12); border: 1px solid rgba(123,108,246,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 1.1rem; }
        .feature-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .feature-desc { font-size: 13px; color: rgba(240,238,255,0.4); line-height: 1.65; }

        /* How it works */
        .how-it-works { padding: 7rem 2rem; display: flex; flex-direction: column; align-items: center; }
        .steps { background: linear-gradient(145deg, rgba(22,20,34,0.9), rgba(14,12,24,0.95)); border: 1px solid rgba(123,108,246,0.12); border-radius: 24px; padding: 3rem; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 2.5rem; max-width: 1100px; width: 100%; position: relative; overflow: hidden; backdrop-filter: blur(16px); margin-top: 1rem; }
        .steps::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(123,108,246,0.4), transparent); }
        .step-number { font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 800; line-height: 1; margin-bottom: 1rem; background: linear-gradient(135deg, rgba(123,108,246,0.6), rgba(123,108,246,0.2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .step-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .step-desc { font-size: 13px; color: rgba(240,238,255,0.35); line-height: 1.65; }

        /* CTA */
        .cta-section { padding: 8rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .cta-section h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.2rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1rem; color: #fff; }
        .cta-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(123,108,246,0.12) 0%, transparent 70%); pointer-events: none; }

        /* Footer */
        footer { position: relative; z-index: 1; padding: 2.5rem 4rem; border-top: 1px solid rgba(123,108,246,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        footer p { font-size: 12px; color: rgba(240,238,255,0.25); }
        footer nav { display: flex; gap: 1.5rem; }
        footer nav a { font-size: 12px; color: rgba(240,238,255,0.3); text-decoration: none; }
        footer nav a:hover { color: rgba(240,238,255,0.7); }

        @media (max-width: 900px) {
          .features-grid { grid-template-columns: 1fr 1fr; }
          .steps { grid-template-columns: 1fr 1fr; }
          .nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          footer { padding: 2rem 1.5rem; flex-direction: column; text-align: center; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr; padding: 2rem; }
        }
      `}</style>

      <div className="bg-fixed">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>
      <div className="bg-grid" />

      <HandleAuth />

      <nav className="nav">
        <a href="#hero" className="nav-logo">
          <div className="logo-mark">TC</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>TicketClub</span>
        </a>
        <div className="nav-links">
          <a href="#features">Funkce</a>
          <a href="#how-it-works">Jak to funguje</a>
        </div>
        <div className="nav-cta">
          {isLoggedIn ? (
            <Link href="/dostupne-sluzby" className="btn-nav-primary">Dashboard →</Link>
          ) : (
            <>
              <Link href="/prihlaseni" className="btn-ghost">Přihlásit se</Link>
              <Link href="/registrace" className="btn-nav-primary">Začít zdarma</Link>
            </>
          )}
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          <span>Profesionální nástroj pro ticket resellery</span>
        </div>
        <h1>Šetři čas.<br /><span className="chrome">Zvyšuj zisky.</span></h1>
        <p>Od evidence nákupů a prodejů až po AI nástroje, statistiky a automatizace. Všechno, co reseller potřebuje na jednom místě.</p>
        <div className="hero-cta">
          {isLoggedIn ? (
            <Link href="/dostupne-sluzby" className="btn-hero">Přejít do dashboardu →</Link>
          ) : (
            <>
              <Link href="/registrace" className="btn-hero">Začít zdarma →</Link>
              <a href="#features" className="btn-hero-ghost">Zjistit více</a>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div className="stat-pill">Průměrný zisk <strong>+Kč1 700 / lístek</strong></div>
          <div className="stat-pill">Aktivních členů <strong>100+</strong></div>
          <div className="stat-pill">Zisk komunity <strong>Kč7.3M</strong></div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="section-label">Funkce</div>
        <div className="section-title">Všechny nástroje pohromadě</div>
        <div className="section-sub">Nákupy, prodeje, statistiky a AI v jednom dashboardu.</div>
        <div className="features-grid">
          {[
            { icon: "📊", title: "P&L Tracker", desc: "Sledujte každý nákup a prodej. Automatické výpočty zisku, ROI a equity křivka v reálném čase." },
            { icon: "🤖", title: "AI Statistiky", desc: "Umělá inteligence analyzuje vaše obchody a dává konkrétní doporučení pro zlepšení výnosů." },
            { icon: "🎯", title: "Doporučené akce", desc: "Ticketmaster API + AI scoring nadcházejících eventů podle vašeho resell profilu." },
            { icon: "🚀", title: "Chrome Launcher", desc: "Spusťte víc Chrome profilů najednou s jedním odkazem. Ideální pro správu více reseller účtů." },
            { icon: "⚡", title: "Extension", desc: "Automatické přidávání lístků do košíku na Ticketmaster. Licencovaná ochrana." },
            { icon: "📅", title: "Kalendář eventů", desc: "Přehled všech vašich nákupů a prodejů podle data na přehledném kalendáři." },
            { icon: "🧮", title: "Kalkulačka profitů", desc: "Break-even analýza a výpočet minimální prodejní ceny před každým nákupem." },
            { icon: "🖼️", title: "P&L Bannery", desc: "Generujte sdílitelné bannery po každém úspěšném flipu. Sdílejte na Discord." },
            { icon: "📥", title: "Import z Excelu", desc: "Nahrajte existující data z Excelu podle naší šablony. Žádné ruční zadávání." },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="section-label">Jak to funguje</div>
        <div className="section-title">Nastavení za méně než 3 minuty</div>
        <div className="section-sub">Žádná složitá nastavení. Jen se zaregistrujte a začněte sledovat.</div>
        <div className="steps">
          {[
            { n: "01", title: "Zaregistrujte se", desc: "Vytvořte účet zdarma. Žádná kreditní karta není potřeba." },
            { n: "02", title: "Nastavte kapitál", desc: "Zadejte počáteční kapitál a měnu. Vše ostatní se počítá automaticky." },
            { n: "03", title: "Přidejte nákupy", desc: "Ručně nebo importem z Excelu. AI screenshot import pro rychlejší zadávání." },
            { n: "04", title: "Sledujte zisky", desc: "Real-time dashboard, AI analýza a doporučení." },
          ].map(s => (
            <div key={s.n}>
              <div className="step-number">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-glow" />
        <h2>Posuňte svůj resell<br /><span className="chrome">na vyšší úroveň.</span></h2>
        <p>Přehled, data a nástroje pro moderní ticket reselling.</p>
        <div className="hero-cta">
          {isLoggedIn ? (
            <Link href="/dostupne-sluzby" className="btn-hero">Přejít do dashboardu →</Link>
          ) : (
            <>
              <Link href="/registrace" className="btn-hero">Zaregistrovat se zdarma →</Link>
              <Link href="/prihlaseni" className="btn-hero-ghost">Přihlásit se</Link>
            </>
          )}
        </div>
      </section>

      <footer>
        <p>© 2026 TicketClub. Všechna práva vyhrazena.</p>
        <nav>
          <a href="#features">Funkce</a>
          {isLoggedIn ? (
            <Link href="/dostupne-sluzby">Dashboard</Link>
          ) : (
            <Link href="/prihlaseni">Přihlásit se</Link>
          )}
        </nav>
      </footer>
    </>
  );
}
