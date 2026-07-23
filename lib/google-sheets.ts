import { google } from "googleapis";

export function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY ?? "").includes("\\n")
        ? process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
        : process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function syncPurchaseToSheet(sheetId: string, purchase: any, sale: any) {
  const sheets = getSheetsClient();
  
  const row = [
    purchase.event_date ? new Date(purchase.event_date).toLocaleDateString("cs-CZ") : (purchase.created_at ? new Date(purchase.created_at).toLocaleDateString("cs-CZ") : ""),
    purchase.event_name ?? "",
    purchase.city ?? purchase.venue ?? "",
    purchase.event_actual_date ? new Date(purchase.event_actual_date).toLocaleDateString("cs-CZ") : "",
    purchase.quantity ?? 0,
    purchase.buy_price ?? 0,
    sale?.quantity_sold ?? 0,
    sale ? (sale.sell_price * sale.quantity_sold) : 0,
    purchase.exchange ?? "",
    purchase.account_ref ?? "",
    purchase.ticket_type_custom ?? purchase.ticket_type ?? "",
    sale?.sold_at ? new Date(sale.sold_at).toLocaleDateString("cs-CZ") : "",
    purchase.paid_out ? "ANO" : "NE",
    purchase.delivered ? "ANO" : "NE",
    purchase.notes ?? "",
  ];

  // Check if header exists
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:O1",
  });

  if (!existing.data.values?.length) {
    // Add header
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "A1:O1",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          "Datum nákupu", "Kapela / Název akce", "Místo akce", "Datum koncertu",
          "Počet lístků", "Nákupní cena celkem (EUR)", "Počet prodaných lístků",
          "Prodejní cena celkem (EUR)", "Burza", "Účet", "Druh vstupenky",
          "Datum prodeje", "Vyplaceno (ANO/NE)", "Doručeno (ANO/NE)", "Poznámky"
        ]]
      }
    });
  }

  // Find row by purchase ID in column P (hidden ID column)
  const allData = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A:P",
  });

  const rows = allData.data.values ?? [];
  const existingRowIndex = rows.findIndex(r => r[15] === purchase.id);

  if (existingRowIndex > 0) {
    // Update existing row
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A${existingRowIndex + 1}:P${existingRowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [[...row, purchase.id]] }
    });
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:P",
      valueInputOption: "RAW",
      requestBody: { values: [[...row, purchase.id]] }
    });
  }
}

export async function fullSyncToSheet(sheetId: string, purchases: any[], sales: any[]) {
  const sheets = getSheetsClient();

  const rows = purchases.map(p => {
    const sale = sales.find(s => s.purchase_id === p.id);
    return [
      p.event_date ? new Date(p.event_date).toLocaleDateString("cs-CZ") : (p.created_at ? new Date(p.created_at).toLocaleDateString("cs-CZ") : ""),
      p.event_name ?? "",
      p.city ?? p.venue ?? "",
      p.event_actual_date ? new Date(p.event_actual_date).toLocaleDateString("cs-CZ") : "",
      p.quantity ?? 0,
      p.buy_price ?? 0,
      sale?.quantity_sold ?? 0,
      sale ? (sale.sell_price * sale.quantity_sold) : 0,
      p.exchange ?? "",
      p.account_ref ?? "",
      p.ticket_type_custom ?? p.ticket_type ?? "",
      sale?.sold_at ? new Date(sale.sold_at).toLocaleDateString("cs-CZ") : "",
      p.paid_out ? "ANO" : "NE",
      p.delivered ? "ANO" : "NE",
      p.notes ?? "",
      p.id,
    ];
  });

  // Clear and rewrite
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: "A:P",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "A1:P1",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        "Datum nákupu", "Kapela / Název akce", "Místo akce", "Datum koncertu",
        "Počet lístků", "Nákupní cena celkem (EUR)", "Počet prodaných lístků",
        "Prodejní cena celkem (EUR)", "Burza", "Účet", "Druh vstupenky",
        "Datum prodeje", "Vyplaceno (ANO/NE)", "Doručeno (ANO/NE)", "Poznámky", "ID"
      ]]
    }
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:P",
      valueInputOption: "RAW",
      requestBody: { values: rows }
    });
  }
}
