import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Datum nákupu",
    "Kapela / Název akce",
    "Místo akce",
    "Datum koncertu",
    "Počet lístků",
    "Nákupní cena celkem (EUR)",
    "Prodejní cena celkem (EUR)",
    "Burza",
    "Účet",
    "Druh vstupenky",
    "Datum prodeje",
    "Vyplaceno (ANO/NIE)",
    "Doručeno (ANO/NIE)",
    "Poznámky",
  ];

  const example = [
    "2026-06-01",
    "Coldplay",
    "Praha",
    "2026-09-15",
    "2",
    "300",
    "500",
    "Viagogo",
    "ucet1@gmail.com",
    "Mobile Transfer",
    "2026-07-01",
    "ANO",
    "ANO",
    "Poznámka",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  ws["!cols"] = [
    { wch: 14 }, { wch: 25 }, { wch: 15 }, { wch: 14 },
    { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 15 },
    { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
    { wch: 16 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Evidence");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ticketclub-sablona.xlsx"',
    },
  });
}
