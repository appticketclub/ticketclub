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
      const res = await fetch("/api/admin/impersonate-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      
      if (!d.magic_link) {
        alert("Chyba: " + d.message);
        return;
      }

      // Extract tokens from magic link hash
      const hashStr = d.magic_link.split('#')[1] ?? '';
      const hashParams = new URLSearchParams(hashStr);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        const supabase = createClient();
        // Set new session as target user (overwrites current session)
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          alert("Chyba session: " + error.message);
          return;
        }
        window.location.href = '/nakupy';
      } else {
        // Fallback
        window.location.href = d.magic_link;
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
