"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HandleAuth() {
  useEffect(() => {
    const supabase = createClient();
    // Handle magic link hash
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/nakupy";
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
