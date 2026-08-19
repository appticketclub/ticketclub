export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      padding: "2rem",
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 48, marginBottom: "1rem" }}>🔧</div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.75rem" }}>
        Probíhá údržba
      </h1>
      <p style={{ fontSize: 15, color: "#525252", maxWidth: 400 }}>
        Momentálně provádíme aktualizace systému. Brzy budeme zpět. Děkujeme za trpělivost.
      </p>
    </div>
  );
}
