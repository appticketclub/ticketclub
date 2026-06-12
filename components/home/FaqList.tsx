"use client";

const faqs = [
  { q: "Je TicketClub legální?", a: "Ano. TicketClub je pouze sledovací nástroj pro vaše vlastní obchodní aktivity. Legálnost resellingu závisí na zákonech vaší země." },
  { q: "Jak funguje Chrome Extension?", a: "Extension automaticky přidává lístky do košíku na Ticketmaster ve vámi nastavený čas. Je dostupná pouze pro Pro uživatele s platnou licencí." },
  { q: "Mohu importovat existující data?", a: "Ano. Stáhněte naši Excel šablonu, vyplňte data a nahrajte. Import proběhne automaticky." },
  { q: "Jak funguje AI Screenshot import?", a: "Nahrajte screenshot potvrzení z Viagogo nebo Ticketmaster a AI automaticky vyplní všechna pole nákupu." },
  { q: "Mohu kdykoli zrušit předplatné?", a: "Ano, předplatné lze zrušit kdykoli bez poplatků. Přístup zůstane aktivní do konce zaplaceného období." },
  { q: "Jaké platformy jsou podporovány?", a: "Sledování funguje pro všechny platformy — Viagogo, StubHub, Ticketmaster, SeatGeek, Facebook a přímý prodej." },
];

export default function FaqList() {
  return (
    <div className="faq-list">
      {faqs.map((f, i) => (
        <div key={i} className="faq-item" onClick={e => e.currentTarget.classList.toggle("open")}>
          <div className="faq-q">
            {f.q}
            <span className="faq-arrow">▼</span>
          </div>
          <div className="faq-a">{f.a}</div>
        </div>
      ))}
    </div>
  );
}
