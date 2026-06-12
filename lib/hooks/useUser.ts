import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

let userCache: any = null;
let userCacheTime = 0;

export function useUser() {
  const [user, setUser] = useState(userCache);

  useEffect(() => {
    if (userCache && Date.now() - userCacheTime < 300000) { // 5 minutes
      setUser(userCache);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      userCache = data.user;
      userCacheTime = Date.now();
      setUser(data.user);
    });
  }, []);

  return user;
}
