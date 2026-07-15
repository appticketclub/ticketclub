"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ImpersonateContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;
    
    (async () => {
      // First sign out current session
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Then verify token and get magic link
      const res = await fetch("/api/admin/impersonate-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      
      if (d.magic_link) {
        window.location.href = d.magic_link;
      } else {
        alert("Chyba: " + d.message);
      }
    })();
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#111", color: "#fff", fontSize: 16 }}>
      Prihlasovanie ako používateľ...
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#111", color: "#fff", fontSize: 16 }}>Načítavanie...</div>}>
      <ImpersonateContent />
    </Suspense>
  );
}