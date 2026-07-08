import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HandleAuth from "@/components/HandleAuth";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      <HandleAuth />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #080808; color: #e8e8e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1.25rem 4rem; display: flex; align-items: center; justify-content: space-between; background: rgba(8,8,8,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-links a { color: #ededed; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: #fff; }
        .nav-cta { display: flex; gap: 0.75rem; }
        .btn-ghost { padding: 8px 20px; background: transparent; border: 1px solid #2a2a2a; border-radius: 8px; color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; transition: border-color 0.2s; }
        .btn-ghost:hover { border-color: #ffffff; }
        .btn-primary { padding: 8px 20px; background: linear-gradient(135deg, #ffffff, #a0a0a0); border: none; border-radius: 8px; color: #000; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; }
        section { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 8rem 4rem; position: relative; overflow: hidden; }
        .hero { flex-direction: column; text-align: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; font-size: 12px; color: #ededed; margin-bottom: 2rem; letter-spacing: 0.08em; }
        .hero h1 { font-size: clamp(3rem, 8vw, 7rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 1.5rem; }
        .chrome { background: linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #808080 70%, #ffffff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero p { font-size: clamp(1rem, 2vw, 1.25rem); color: #ededed; max-width: 600px; line-height: 1.7; margin-bottom: 3rem; }
        .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-hero { padding: 1rem 2.5rem; background: linear-gradient(135deg, #ffffff, #a0a0a0); border: none; border-radius: 12px; color: #000; font-size: 15px; font-weight: 800; cursor: pointer; text-decoration: none; letter-spacing: 0.05em; }
        .btn-hero-ghost { padding: 1rem 2.5rem; background: transparent; border: 1px solid #2a2a2a; border-radius: 12px; color: #ffffff; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .hero-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(192,192,192,0.04) 0%, transparent 70%); pointer-events: none; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; }
        @media (max-width: 768px) {
          .nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          section { padding: 6rem 1.5rem; }
        }
      `}</style>

      <nav className="nav">
        <a href="#hero"><img src="/logo.png" alt="TicketClub" style={{ height: 36 }} /></a>
        <div className="nav-links">
          <a href="#features">Funkce</a>
          <a href="#how-it-works">Jak to funguje</a>
        </div>
        <div className="nav-cta">
          {isLoggedIn ? (
            <Link href="/dostupne-sluzby" className="btn-primary">Dashboard →</Link>
          ) : (
            <>
              <Link href="/prihlaseni" className="btn-ghost">Přihlásit se</Link>
              <Link href="/registrace" className="btn-primary">Začít zdarma</Link>
            </>
          )}
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-badge"><span>🎫</span><span>Profesionální nástroj pro ticket resellery</span></div>
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
      </section>

      <style>{`
        .features { flex-direction: column; }
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #ededed; margin-bottom: 1rem; text-transform: uppercase; }
        .section-title { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem; line-height: 1.1; text-align: center; }
        .section-sub { font-size: 1.1rem; color: #ededed; max-width: 500px; line-height: 1.7; margin-bottom: 4rem; text-align: center; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; width: 100%; max-width: 1100px; }
        .feature-card { background: #111111; border: 1px solid #1a1a1a; border-radius: 20px; padding: 2rem; position: relative; overflow: hidden; transition: border-color 0.3s, transform 0.3s; }
        .feature-card:hover { border-color: #2a2a2a; transform: translateY(-4px); }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(192,192,192,0.2), transparent); }
        .feature-icon { font-size: 2rem; margin-bottom: 1rem; }
        .feature-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .feature-desc { font-size: 13px; color: #ededed; line-height: 1.6; }
        .how-it-works { flex-direction: column; background: #050505; }
        .steps { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 20px; padding: 2.5rem; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 2rem; max-width: 1200px; width: 100%; margin-top: 4rem; }
        .step-number { font-size: 4rem; font-weight: 800; color: #a0a0a0; line-height: 1; margin-bottom: 1rem; }
        .step-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .step-desc { font-size: 13px; color: #6b6b6b; line-height: 1.6; }
        div#features, div#how-it-works { display: none; }
      `}</style>

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

      <style>{`
        .cta-section { flex-direction: column; text-align: center; }
        .cta-section h2 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1rem; }
        .cta-section p { font-size: 1.1rem; color: #ededed; margin-bottom: 3rem; }
        footer { padding: 3rem 4rem; border-top: 1px solid #111; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        footer p { font-size: 12px; color: #ededed; }
        footer nav { display: flex; gap: 1.5rem; }
        footer nav a { font-size: 12px; color: #ededed; text-decoration: none; }
        footer nav a:hover { color: #ffffff; }
        @media (max-width: 768px) {
          footer { padding: 2rem 1.5rem; flex-direction: column; text-align: center; }
        }
      `}</style>

      <section className="cta-section">
        <div className="hero-glow" />
        <div className="hero-grid" />
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
