import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const headers = [
  "Název akce",
  "Město / Země",
  "Datum nákupu",
  "Datum akce",
  "Sektor / Sedadlo",
  "Burza",
  "Nákupní účet",
  "Počet lístků",
  "Cena za lístek",
  "Měna",
  "Poznámky",
  "Doručeno (ANO/NIE)",
  "Vyplaceno (ANO/NIE)",
];

const example = [
  "Coldplay Prague 2026",
  "Praha, Česká republika",
  "04.06.2026",
  "15.08.2026",
  "Sekce A, Řada 5, Místo 12",
  "Viagogo",
  "Hlavní účet",
  "2",
  "1500",
  "CZK",
  "Volitelná poznámka",
  "NIE",
  "NIE",
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headers, example]);

// Column widths
ws["!cols"] = [
  { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
  { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
  { wch: 15 }, { wch: 8 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
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
