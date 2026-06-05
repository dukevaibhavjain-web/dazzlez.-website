/**
 * Generates a small test Excel file at scripts/test-import.xlsx
 * with 3 rings and 2 earrings — enough to exercise the import preview.
 *
 * Run: npx tsx scripts/create-test-excel.ts
 */
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const RINGS_ROWS = [
  { "STYLE CODE": "TEST-RR-001", "PRODUCT NAME": "Round Solitaire Ring", "PRODUCT DESCRIPTION": "Classic round brilliant solitaire in 18K yellow gold", "GOLD WEIGHT 14K": 3.2, "GOLD WEIGHT 18K": 3.5, "DIAMOND SHAPE": "Round", "Small Ct": 0.1, "Small - Num": 8, "Solitaire Ct": 0.5, "Solitaire - Num": 1, "DIAMOND SIZE": "5.2*5.2", Remarks: "Bestseller" },
  { "STYLE CODE": "",           "PRODUCT NAME": null, "PRODUCT DESCRIPTION": null, "GOLD WEIGHT 14K": null, "GOLD WEIGHT 18K": null, "DIAMOND SHAPE": null, "Small Ct": 0.08, "Small - Num": 12, "Solitaire Ct": null, "Solitaire - Num": null, "DIAMOND SIZE": "1.5*1.5", Remarks: null },
  { "STYLE CODE": "TEST-RR-002", "PRODUCT NAME": "Oval Halo Ring", "PRODUCT DESCRIPTION": "Oval center stone with pave halo", "GOLD WEIGHT 14K": 4.1, "GOLD WEIGHT 18K": 4.5, "DIAMOND SHAPE": "Oval", "Small Ct": 0.25, "Small - Num": 20, "Solitaire Ct": 0.75, "Solitaire - Num": 1, "DIAMOND SIZE": "7*5", Remarks: null },
  { "STYLE CODE": "TEST-RR-003", "PRODUCT NAME": "Eternity Band", "PRODUCT DESCRIPTION": "Full eternity band with round brilliants", "GOLD WEIGHT 14K": 2.8, "GOLD WEIGHT 18K": 3.1, "GOLD WEIGHT 22K": 3.5, "DIAMOND SHAPE": "Round", "Small Ct": 1.2, "Small - Num": 22, "Solitaire Ct": null, "Solitaire - Num": null, "DIAMOND SIZE": "2.5*2.5", Remarks: "Also in 22K" },
];

const EARRINGS_ROWS = [
  { "STYLE CODE": "TEST-ER-001", "PRODUCT NAME": "Diamond Stud Earrings", "PRODUCT DESCRIPTION": "Classic round brilliant studs in 18K", "GOLD WEIGHT 14K": 1.4, "GOLD WEIGHT 18K": 1.6, "DIAMOND SHAPE": "Round", "DIAMOND WEIGHT": 0.4, "NUMBER OF DIAMOND": 2, "DIAMOND SIZE": "4.1*4.1", Remarks: null },
  { "STYLE CODE": "TEST-ER-002", "PRODUCT NAME": "Oval Drop Earrings", "PRODUCT DESCRIPTION": "Elegant oval drops with baguette accents", "GOLD WEIGHT 14K": 2.2, "GOLD WEIGHT 18K": 2.5, "DIAMOND SHAPE": "Oval", "DIAMOND WEIGHT": 0.8, "NUMBER OF DIAMOND": 2, "DIAMOND SIZE": "6*4", Remarks: "New arrival" },
];

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(RINGS_ROWS),    "Rings");
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(EARRINGS_ROWS), "Earrings");

const outPath = path.join(dirname, "test-import.xlsx");
xlsx.writeFile(wb, outPath);
console.log(`✅  Created ${outPath}`);
console.log(`   3 rings  (TEST-RR-001, TEST-RR-002, TEST-RR-003)`);
console.log(`   2 earrings (TEST-ER-001, TEST-ER-002)`);
