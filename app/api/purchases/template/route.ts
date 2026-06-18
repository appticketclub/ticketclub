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
    "Burza",
    "Účet",
    "Druh vstupenky",
    "Poznámky",
  ];

  const example = [
    "2026-06-01",
    "Coldplay",
    "Praha",
    "2026-09-15",
    "2",
    "300",
    "Viagogo",
    "ucet1@gmail.com",
    "Mobile Transfer",
    "Poznámka",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Column widths
  ws["!cols"] = [
    { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 22 },
    { wch: 18 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Nákupy");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ticketclub-sablona.xlsx"',
    },
  });
}
