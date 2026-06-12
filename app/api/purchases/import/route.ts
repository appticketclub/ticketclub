import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Skip header row
    const dataRows = rows.slice(1).filter(row => row[0]);

    const purchases = dataRows.map(row => {
        const parseDate = (val: any) => {
          if (!val) return null;
          const str = String(val).trim();
          // Try DD.MM.YYYY
          const parts = str.split(".");
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
          // Try YYYY-MM-DD
          if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
          return null;
        };

        const currency = String(row[9] ?? "CZK").trim().toUpperCase();
        const validCurrency = ["EUR", "CZK"].includes(currency) ? currency : "CZK";

        return {
          user_id: user.id,
          event_name: String(row[0] ?? "").trim(),
          city: String(row[1] ?? "").trim() || null,
          event_date: parseDate(row[2]),
          event_actual_date: parseDate(row[3]),
          venue: String(row[4] ?? "").trim() || null, // Sektor / Sedadlo
          exchange: String(row[5] ?? "").trim() || null, // Burza
          account_ref: String(row[6] ?? "").trim() || null, // Nákupní účet
          quantity: parseInt(row[7]) || 1,
          buy_price: parseFloat(String(row[8]).replace(",", ".")) || 0,
          currency: validCurrency,
          notes: String(row[10] ?? "").trim() || null, // Poznámky
          delivered: String(row[11] ?? "").toLowerCase().includes("ano"),
          paid_out: String(row[12] ?? "").toLowerCase().includes("ano"),
          status: "active",
        };
      }).filter(p => p.event_name && p.buy_price > 0);

    if (purchases.length === 0) {
      return NextResponse.json({ error: "Žádné platné záznamy nenalezeny" }, { status: 400 });
    }

    const { error } = await supabase.from("purchases").insert(purchases);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update capital for each purchase
    const totalCost = purchases.reduce((s, p) => s + (p.buy_price * p.quantity), 0);
    const { data: profile } = await supabase.from("profiles").select("capital").eq("id", user.id).single();
    if (profile) {
      const newBalance = (profile.capital ?? 0) - totalCost;
      await supabase.from("profiles").update({ capital: newBalance }).eq("id", user.id);
      await supabase.from("capital_history").insert({
        user_id: user.id,
        amount: -totalCost,
        type: "purchase",
        description: `Import z Excelu — ${purchases.length} nákupů`,
        balance_after: newBalance,
      });

      // After inserting, check count and delete oldest if over 100
      const { count } = await supabase
        .from("capital_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) > 100) {
        const { data: oldest } = await supabase
          .from("capital_history")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(10);
        if (oldest?.length) {
          await supabase.from("capital_history").delete().in("id", oldest.map(r => r.id));
        }
      }
    }

    return NextResponse.json({ success: true, imported: purchases.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
