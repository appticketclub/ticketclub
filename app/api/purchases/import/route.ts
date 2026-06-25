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

    const parseDate = (val: any): string | null => {
      if (!val) return null;
      const str = String(val).trim();

      // DD.MM.YYYY format
      const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (dotMatch) {
        const [, d, m, y] = dotMatch;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }

      // DD-MM-YYYY format
      const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dashMatch) {
        const [, d, m, y] = dashMatch;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }

      // YYYY-MM-DD format (already correct)
      const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) return str;

      // Excel serial date number
      if (!isNaN(Number(val))) {
        const date = new Date((Number(val) - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }

      // Try native Date parse as fallback
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

      return null;
    };

    // Skip header row
    const dataRows = rows.slice(1).filter(row => row[1]);
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const eventDate = parseDate(row[0]);
        const eventName = String(row[1] || "").trim();
        const city = String(row[2] || "").trim() || null;
        const eventActualDate = parseDate(row[3]);
        const quantity = parseInt(row[4]) || 1;
        const buyPriceTotal = parseFloat(String(row[5]).replace(",", ".")) || 0;
        const buyPrice = quantity > 0 ? buyPriceTotal / quantity : buyPriceTotal;
        const sellPriceTotal = parseFloat(String(row[6]).replace(",", ".")) || 0;
        const exchange = String(row[7] || "").trim() || null;
        const accountRef = String(row[8] || "").trim() || null;
        const ticketType = String(row[9] || "").trim() || null;
        const soldAtRaw = parseDate(row[10]);
        const soldAt = soldAtRaw ? new Date(soldAtRaw).toISOString() : null;
        const paidOut = String(row[11] || "").trim().toUpperCase() === "ANO";
        const delivered = String(row[12] || "").trim().toUpperCase() === "ANO";
        const notes = String(row[13] || "").trim() || null;

        if (!eventName) continue;

        // Insert purchase
        const { data: purchase, error: purchaseError } = await supabase
          .from("purchases")
          .insert({
            user_id: user.id,
            event_name: eventName,
            city,
            event_date: eventDate,
            event_actual_date: eventActualDate,
            quantity,
            quantity_remaining: sellPriceTotal > 0 ? 0 : quantity,
            buy_price: buyPrice,
            currency: "EUR",
            status: sellPriceTotal > 0 ? "sold" : "active",
            exchange,
            account_ref: accountRef,
            ticket_type_custom: ticketType,
            paid_out: paidOut,
            delivered,
            notes,
          })
          .select()
          .single();

        if (purchaseError) {
          errors.push(`Řádek ${i + 2}: ${purchaseError.message}`);
          continue;
        }

        // If sell price exists — insert sale and banner
        if (sellPriceTotal > 0 && purchase) {
          const sellPricePerTicket = sellPriceTotal / quantity;
          const { error: saleError } = await supabase.from("sales").insert({
            user_id: user.id,
            purchase_id: purchase.id,
            quantity_sold: quantity,
            sell_price: sellPricePerTicket,
            currency: "EUR",
            sold_at: soldAt ?? new Date().toISOString(),
            platform: exchange,
          });
          if (saleError) {
            errors.push(`Řádek ${i + 2}: ${saleError.message}`);
          }
          
          // Generate banner
          const profit = sellPriceTotal - buyPriceTotal; 
          const roi = buyPriceTotal > 0 ? (profit / buyPriceTotal) * 100 : 0; 
 
          await supabase.from("banners").insert({ 
            user_id: user.id, 
            purchase_id: purchase.id, 
            event_name: eventName, 
            buy_price: buyPriceTotal, 
            sell_price: sellPriceTotal, 
            quantity: quantity, 
            fees: 0, 
            profit: profit, 
            roi: roi, 
            currency: "EUR", 
            platform: exchange ?? null, 
          }); 
        }

        imported++;
      } catch (err: any) {
        errors.push(`Řádek ${i + 2}: ${err.message}`);
      }
    }

    if (imported === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
    }

    return NextResponse.json({ success: true, imported, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
