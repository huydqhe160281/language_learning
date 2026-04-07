"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { App, Popconfirm } from "antd";
import { FileUp, Trash2, X } from "lucide-react";
import { setsApiClient, StudySet, ApiError } from "@/lib/api";
import { DashboardShell } from "../../_components/dashboard-shell";

// ─── CSV parser ───────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line, handling double-quoted fields with embedded
 * commas or newlines, and tab-separated values.
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        // Check escaped quote ""
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

interface ParsedCard {
  front: string;
  back: string;
  example: string;
  /** true if this row should be excluded (e.g., detected header) */
  isHeader?: boolean;
}

function parseCSV(text: string): ParsedCard[] {
  // Normalise line endings
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Auto-detect delimiter: prefer tab, else comma
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

  // Auto-detect header: if first row's "front" looks like a column label
  // (case-insensitive match to common names), mark it
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

// ─── CSV Import Panel ─────────────────────────────────────────────────────────

interface CsvImportPanelProps {
  setId: string;
  onClose: () => void;
  onImported: () => void;
}

function CsvImportPanel({ setId, onClose, onImported }: CsvImportPanelProps) {
  const { message } = App.useApp();
  const [parsed, setParsed] = useState<ParsedCard[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      message.error("Chỉ hỗ trợ file .csv, .tsv hoặc .txt");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        message.warning("Không tìm thấy dữ liệu hợp lệ trong file");
      }
      setParsed(rows);
    };
    reader.readAsText(file, "utf-8");
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const validRows = parsed.filter((r) => !r.isHeader && r.front && r.back);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const result = await setsApiClient.importCards(setId, {
        cards: validRows.map((r) => ({
          front: r.front,
          back: r.back,
          ...(r.example ? { example: r.example } : {}),
        })),
      });
      message.success(`Đã import ${result.imported} thẻ thành công`);
      onImported();
      onClose();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Import thất bại");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">Import từ CSV</h4>
          <p className="mt-0.5 text-xs text-gray-500">
            Mỗi hàng:{" "}
            <code className="rounded bg-gray-100 px-1">
              front, back, example (tuỳ chọn)
            </code>
            &nbsp;— cũng hỗ trợ tab-separated (.tsv)
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
        }`}
      >
        <FileUp size={28} className="mb-2 text-blue-400" />
        {fileName ? (
          <p className="text-sm font-medium text-gray-700">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Kéo thả file vào đây
            </p>
            <p className="text-xs text-gray-400">hoặc click để chọn file</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Preview table */}
      {parsed.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Preview ({validRows.length} thẻ hợp lệ
              {parsed.length - validRows.length > 0 &&
                `, ${parsed.length - validRows.length} bỏ qua`}
              )
            </span>
          </div>
          <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Front</th>
                  <th className="px-3 py-2 text-left font-medium">Back</th>
                  <th className="px-3 py-2 text-left font-medium">Example</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.isHeader
                        ? "bg-yellow-50 text-gray-400"
                        : !row.front || !row.back
                          ? "bg-red-50 text-gray-400"
                          : ""
                    }
                  >
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="max-w-[140px] truncate px-3 py-1.5 font-medium text-gray-900">
                      {row.front || <span className="text-red-400">trống</span>}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-1.5 text-gray-600">
                      {row.back || <span className="text-red-400">trống</span>}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-1.5 text-gray-400">
                      {row.example || "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      {row.isHeader ? (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                          header
                        </span>
                      ) : !row.front || !row.back ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                          bỏ qua
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tip + action */}
      {parsed.length === 0 && (
        <div className="rounded-lg bg-white p-4 text-xs text-gray-500">
          <p className="mb-1 font-medium text-gray-600">Ví dụ định dạng CSV:</p>
          <pre className="overflow-auto rounded bg-gray-50 p-2 text-gray-500">
            {`front,back,example
こんにちは,Hello,こんにちは、元気ですか？
ありがとう,Thank you,
猫,Cat,猫が好きです`}
          </pre>
        </div>
      )}

      {validRows.length > 0 && (
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {importing ? "Đang import…" : `Import ${validRows.length} thẻ`}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add card form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [example, setExample] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Tab: "manual" | "csv"
  const [addMode, setAddMode] = useState<"manual" | "csv">("manual");

  const { message } = App.useApp();

  const loadSet = async () => {
    if (!id) return;
    const data = await setsApiClient.getById(id);
    setSet(data);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    loadSet()
      .catch(() => {
        if (!cancelled) setError("Could not load this set.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!front.trim() || !back.trim()) {
      setAddError("Nhập cả mặt trước và mặt sau.");
      return;
    }
    setAdding(true);
    try {
      await setsApiClient.addCard(id, {
        front: front.trim(),
        back: back.trim(),
        ...(example.trim() ? { example: example.trim() } : {}),
      });
      setFront("");
      setBack("");
      setExample("");
      message.success("Đã thêm thẻ mới");
      await loadSet();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi";
      setAddError(msg);
      message.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await setsApiClient.removeCard(id, cardId);
      message.success("Đã xóa thẻ");
      setSet((prev) =>
        prev
          ? {
              ...prev,
              cards: (prev.cards ?? []).filter((c) => c.id !== cardId),
            }
          : prev,
      );
    } catch {
      message.error("Không thể xóa thẻ");
    }
  };

  const handleDeleteSet = async () => {
    try {
      await setsApiClient.remove(id);
      message.success("Đã xóa bộ từ");
      router.push("/dashboard/sets");
    } catch {
      message.error("Không thể xóa bộ từ");
    }
  };

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/sets"
          className="mb-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Sets
        </Link>

        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : error || !set ? (
          <div className="rounded-xl bg-white p-8 shadow">
            <p className="text-red-600">{error || "Set not found."}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Set header */}
            <div className="rounded-xl bg-white p-8 shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 text-3xl font-bold text-gray-900">
                    {set.title}
                  </h2>
                  <p className="mb-2 text-gray-500">{set.language}</p>
                  {set.description ? (
                    <p className="mb-4 text-gray-600">{set.description}</p>
                  ) : null}
                </div>

                <Popconfirm
                  title="Xóa bộ từ?"
                  description="Tất cả thẻ và tiến độ sẽ bị xóa vĩnh viễn."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDeleteSet}
                  placement="bottomRight"
                >
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Xóa bộ từ
                  </button>
                </Popconfirm>
              </div>

              <Link href={`/dashboard/study/${set.id}`}>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Start studying
                </button>
              </Link>
            </div>

            {/* Add card section — manual + CSV import tabs */}
            <div className="rounded-xl bg-white p-8 shadow">
              {/* Tab switcher */}
              <div className="mb-5 flex w-fit items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setAddMode("manual")}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                    addMode === "manual"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Thêm thủ công
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("csv")}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition ${
                    addMode === "csv"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileUp size={14} />
                  Import CSV
                </button>
              </div>

              {/* Manual add form */}
              {addMode === "manual" && (
                <form onSubmit={handleAddCard} className="max-w-xl space-y-4">
                  {addError ? (
                    <p className="text-sm text-red-600">{addError}</p>
                  ) : null}
                  <div>
                    <label
                      htmlFor="card-front"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Mặt trước (từ / kanji)
                    </label>
                    <input
                      id="card-front"
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="こんにちは"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card-back"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Mặt sau (nghĩa)
                    </label>
                    <input
                      id="card-back"
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Hello"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card-example"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Ví dụ{" "}
                      <span className="font-normal text-gray-400">
                        (tuỳ chọn)
                      </span>
                    </label>
                    <input
                      id="card-example"
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="こんにちは、元気ですか？"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adding}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {adding ? "Đang thêm…" : "Thêm thẻ"}
                  </button>
                </form>
              )}

              {/* CSV import panel */}
              {addMode === "csv" && (
                <CsvImportPanel
                  setId={id}
                  onClose={() => setAddMode("manual")}
                  onImported={loadSet}
                />
              )}
            </div>

            {/* Card list */}
            <div className="rounded-xl bg-white p-8 shadow">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Cards ({(set.cards ?? []).length})
              </h3>
              {(set.cards ?? []).length === 0 ? (
                <p className="text-gray-500">Chưa có thẻ — thêm ở trên.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(set.cards ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="group flex items-center gap-4 py-3"
                    >
                      <span className="w-1/3 font-medium text-gray-900">
                        {c.front}
                      </span>
                      <span className="w-1/3 text-gray-600">{c.back}</span>
                      <span className="flex-1 truncate text-sm text-gray-400">
                        {c.example ?? ""}
                      </span>

                      <Popconfirm
                        title="Xóa thẻ này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteCard(c.id)}
                        placement="left"
                      >
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                          title="Xóa thẻ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Popconfirm>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
