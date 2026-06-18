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
    const dataRows = rows.slice(1).filter(row => row[1]);

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

    const purchases = dataRows.map(row => {
        const eventDate = parseDate(row[0]);
        const eventName = String(row[1] || "").trim();
        const city = String(row[2] || "").trim() || null;
        const eventActualDate = parseDate(row[3]);
        const quantity = parseInt(row[4]) || 1;
        const buyPriceTotal = parseFloat(String(row[5]).replace(",", ".")) || 0;
        const buyPrice = quantity > 0 ? buyPriceTotal / quantity : buyPriceTotal;
        const exchange = String(row[6] || "").trim() || null;
        const accountRef = String(row[7] || "").trim() || null;
        const ticketType = String(row[8] || "").trim() || null;
        const notes = String(row[9] || "").trim() || null;

        return {
          user_id: user.id,
          event_name: eventName,
          city,
          event_date: eventDate,
          event_actual_date: eventActualDate,
          quantity,
          quantity_remaining: quantity,
          buy_price: buyPrice,
          currency: "EUR",
          exchange,
          account_ref: accountRef,
          ticket_type_custom: ticketType,
          notes,
          status: "active",
        };
      }).filter(p => p.event_name);

    if (purchases.length === 0) {
      return NextResponse.json({ error: "Žádné platné záznamy nenalezeny" }, { status: 400 });
    }

    const { error } = await supabase.from("purchases").insert(purchases);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, imported: purchases.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
