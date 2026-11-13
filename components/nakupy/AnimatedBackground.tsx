"use client";

export default function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(80px, -100px) scale(1.2); }
          66% { transform: translate(-60px, 50px) scale(0.85); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-90px, 80px) scale(1.15); }
          66% { transform: translate(70px, -50px) scale(0.9); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(60px, 80px) scale(1.25); }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "#07060f" }} />

      {/* Blob 1 — bright purple, top left */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        top: "-15%", left: "-5%",
        width: "55vw", height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,60,255,0.35) 0%, rgba(80,30,200,0.15) 40%, transparent 70%)",
        animation: "blob1 16s ease-in-out infinite",
        filter: "blur(30px)",
      }} />

      {/* Blob 2 — violet, right */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        top: "10%", right: "-10%",
        width: "50vw", height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(150,80,255,0.28) 0%, rgba(100,40,220,0.1) 45%, transparent 70%)",
        animation: "blob2 20s ease-in-out infinite",
        filter: "blur(35px)",
      }} />

      {/* Blob 3 — bottom center */}
      <div style={{
        position: "fixed", zIndex: 0, pointerEvents: "none",
        bottom: "-10%", left: "25%",
        width: "50vw", height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(90,50,230,0.22) 0%, transparent 65%)",
        animation: "blob3 24s ease-in-out infinite",
        filter: "blur(40px)",
      }} />

      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(123,108,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,108,246,0.04) 1px, transparent 1px)`,
        backgroundSize: "52px 52px",
      }} />
    </>
  );
}
