"use client";

export default function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -80px) scale(1.15); }
          66% { transform: translate(-40px, 40px) scale(0.9); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-70px, 60px) scale(1.1); }
          66% { transform: translate(50px, -30px) scale(0.95); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, 50px) scale(0.9); }
          66% { transform: translate(-60px, -60px) scale(1.2); }
        }
        @keyframes blob4 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 70px) scale(1.1); }
        }
      `}</style>

      {/* Dark base */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "#07060f",
      }} />

      {/* Blob 1 — large purple, top left */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        top: "-20%", left: "-10%",
        width: "60vw", height: "60vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(100,60,220,0.18) 0%, transparent 70%)",
        animation: "blob1 18s ease-in-out infinite",
        filter: "blur(40px)",
      }} />

      {/* Blob 2 — violet, top right */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        top: "-10%", right: "-15%",
        width: "50vw", height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(130,60,255,0.12) 0%, transparent 70%)",
        animation: "blob2 22s ease-in-out infinite",
        filter: "blur(50px)",
      }} />

      {/* Blob 3 — deep purple, center */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        top: "30%", left: "30%",
        width: "40vw", height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(80,30,180,0.1) 0%, transparent 70%)",
        animation: "blob3 26s ease-in-out infinite",
        filter: "blur(60px)",
      }} />

      {/* Blob 4 — small bright, bottom right */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        bottom: "-5%", right: "10%",
        width: "35vw", height: "35vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(123,108,246,0.13) 0%, transparent 70%)",
        animation: "blob4 20s ease-in-out infinite",
        filter: "blur(45px)",
      }} />

      {/* Subtle grid overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(123,108,246,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(123,108,246,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "52px 52px",
      }} />
    </>
  );
}
