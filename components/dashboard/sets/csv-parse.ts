export interface ParsedCard {
  front: string;
  back: string;
  example: string;
  isHeader?: boolean;
}

export function parseCSVLine(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (line.startsWith(delimiter, i)) {
      cols.push(cur);
      cur = "";
      i += delimiter.length - 1;
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

export function parseCSV(text: string): ParsedCard[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const sampleLine = lines.find((l) => l.trim()) ?? "";
  const delimiter = sampleLine.includes("\t") ? "\t" : ",";
  const rows: ParsedCard[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const cols = parseCSVLine(line, delimiter);
    const front = (cols[0] ?? "").trim();
    const back = (cols[1] ?? "").trim();
    const example = (cols[2] ?? "").trim();
    if (!front && !back) continue;
    rows.push({ front, back, example });
  }

  if (rows.length > 0) {
    const f = rows[0].front.toLowerCase();
    const b = rows[0].back.toLowerCase();
    if (
      (f === "front" || f === "term" || f === "word" || f === "kanji") &&
      (b === "back" || b === "definition" || b === "meaning" || b === "reading")
    ) {
      rows[0].isHeader = true;
    }
  }

  return rows;
}
