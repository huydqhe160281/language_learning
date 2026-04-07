"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteOutlined, InboxOutlined, LeftOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Popconfirm,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from "@/components/antd-ui";
import { setsApiClient, StudySet, ApiError } from "@/lib/api";
import { DashboardShell } from "../../_components/dashboard-shell";

const { Title, Text } = Typography;
const { Dragger } = Upload;

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string, delimiter: string): string[] {
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

interface ParsedCard {
  front: string;
  back: string;
  example: string;
  isHeader?: boolean;
}

function parseCSV(text: string): ParsedCard[] {
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

// ─── CSV Import Panel ─────────────────────────────────────────────────────────

interface CsvImportPanelProps {
  setId: string;
  onImported: () => void;
}

function CsvImportPanel({ setId, onImported }: CsvImportPanelProps) {
  const { message } = App.useApp();
  const [parsed, setParsed] = useState<ParsedCard[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
        message.error("Chỉ hỗ trợ file .csv, .tsv hoặc .txt");
        return false;
      }
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
      return false; // prevent antd default upload
    },
    [message],
  );

  const draggerProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".csv,.tsv,.txt",
    beforeUpload: (file) => {
      handleFile(file);
      return false;
    },
    showUploadList: false,
  };

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
      setParsed([]);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Import thất bại");
    } finally {
      setImporting(false);
    }
  };

  const previewColumns = [
    { title: "#", dataIndex: "idx", width: 48 },
    {
      title: "Front",
      dataIndex: "front",
      render: (v: string) =>
        v ? <Text strong>{v}</Text> : <Text type="danger">trống</Text>,
    },
    {
      title: "Back",
      dataIndex: "back",
      render: (v: string) => (v ? v : <Text type="danger">trống</Text>),
    },
    {
      title: "Example",
      dataIndex: "example",
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_: unknown, row: ParsedCard) =>
        row.isHeader ? (
          <Tag color="gold">header</Tag>
        ) : !row.front || !row.back ? (
          <Tag color="red">bỏ qua</Tag>
        ) : (
          <Tag color="green">✓</Tag>
        ),
    },
  ];

  const previewData = parsed.map((row, i) => ({ ...row, idx: i + 1, key: i }));

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Mỗi hàng: <Text code>front, back, example (tuỳ chọn)</Text> — cũng hỗ
        trợ tab-separated (.tsv)
      </Text>

      <Dragger {...draggerProps} style={{ marginTop: 12, marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Kéo thả file vào đây hoặc click để chọn
        </p>
        <p className="ant-upload-hint">.csv, .tsv, .txt — UTF-8</p>
      </Dragger>

      {parsed.length === 0 && (
        <Card size="small" style={{ background: "#f9fafb" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ví dụ định dạng CSV:
          </Text>
          <pre
            style={{
              background: "#f3f4f6",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 12,
              marginTop: 8,
            }}
          >{`front,back,example\nこんにちは,Hello,こんにちは、元気ですか？\nありがとう,Thank you,\n猫,Cat,猫が好きです`}</pre>
        </Card>
      )}

      {parsed.length > 0 && (
        <>
          <Text style={{ fontSize: 13 }}>
            Preview ({validRows.length} thẻ hợp lệ
            {parsed.length - validRows.length > 0 &&
              `, ${parsed.length - validRows.length} bỏ qua`}
            )
          </Text>
          <Table
            size="small"
            columns={previewColumns}
            dataSource={previewData}
            pagination={false}
            scroll={{ y: 220 }}
            style={{ marginTop: 8, marginBottom: 16 }}
          />
          <Button
            type="primary"
            loading={importing}
            disabled={validRows.length === 0}
            onClick={handleImport}
          >
            {importing ? "Đang import…" : `Import ${validRows.length} thẻ`}
          </Button>
        </>
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
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const { message } = App.useApp();
  const [form] = Form.useForm();
  const loadingRef = useRef(false);

  const loadSet = useCallback(async () => {
    if (!id || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const data = await setsApiClient.getById(id);
      setSet(data);
    } catch {
      setError("Could not load this set.");
    } finally {
      loadingRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setsApiClient
      .getById(id)
      .then((data) => {
        if (!cancelled) setSet(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this set.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddCard = async (values: {
    front: string;
    back: string;
    example?: string;
  }) => {
    setAdding(true);
    try {
      await setsApiClient.addCard(id, {
        front: values.front.trim(),
        back: values.back.trim(),
        ...(values.example?.trim() ? { example: values.example.trim() } : {}),
      });
      message.success("Đã thêm thẻ mới");
      form.resetFields();
      await loadSet();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi";
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

  const handleDeleteSelectedCards = async () => {
    const cardIds = selectedCardIds;
    if (cardIds.length === 0) return;

    try {
      await Promise.all(
        cardIds.map((cardId) => setsApiClient.removeCard(id, cardId)),
      );
      message.success(`Đã xóa ${cardIds.length} thẻ`);
      setSelectedCardIds([]);
      setSet((prev) =>
        prev
          ? {
              ...prev,
              cards: (prev.cards ?? []).filter((c) => !cardIds.includes(c.id)),
            }
          : prev,
      );
    } catch {
      message.error("Không thể xóa các thẻ đã chọn");
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

  const cardColumns = [
    {
      title: "Front",
      dataIndex: "front",
      width: "30%",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: "Back", dataIndex: "back", width: "30%" },
    {
      title: "Example",
      dataIndex: "example",
      width: "30%",
      render: (v: string | null) => (v ? v : <Text type="secondary">—</Text>),
    },
    {
      title: "",
      key: "actions",
      width: "10%",
      render: (_: unknown, record: { id: string }) => (
        <Popconfirm
          title="Xóa thẻ này?"
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDeleteCard(record.id)}
          placement="left"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: "manual",
      label: "Thêm thủ công",
      children: (
        <Form form={form} layout="vertical" onFinish={handleAddCard}>
          <Form.Item
            label="Mặt trước (từ / kanji)"
            name="front"
            rules={[{ required: true, message: "Nhập mặt trước" }]}
          >
            <Input placeholder="こんにちは" />
          </Form.Item>
          <Form.Item
            label="Mặt sau (nghĩa)"
            name="back"
            rules={[{ required: true, message: "Nhập mặt sau" }]}
          >
            <Input placeholder="Hello" />
          </Form.Item>
          <Form.Item
            label={
              <>
                Ví dụ <Text type="secondary">(tuỳ chọn)</Text>
              </>
            }
            name="example"
          >
            <Input placeholder="こんにちは、元気ですか？" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={adding}>
              {adding ? "Đang thêm…" : "Thêm thẻ"}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "csv",
      label: "Import CSV",
      children: <CsvImportPanel setId={id} onImported={loadSet} />,
    },
  ];

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/sets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 24,
            color: "#2563eb",
          }}
        >
          <LeftOutlined style={{ fontSize: 12 }} /> Back to Sets
        </Link>

        {error || !set ? (
          <Alert type="error" message={error || "Set not found."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Set header */}
            <Card
              extra={
                <Popconfirm
                  title="Xóa bộ từ?"
                  description="Tất cả thẻ và tiến độ sẽ bị xóa vĩnh viễn."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDeleteSet}
                  placement="bottomRight"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa bộ từ
                  </Button>
                </Popconfirm>
              }
            >
              <Title level={3} style={{ marginBottom: 4 }}>
                {set.title}
              </Title>
              <Text type="secondary">{set.language}</Text>
              {set.description && (
                <p style={{ marginTop: 8, color: "#6b7280" }}>
                  {set.description}
                </p>
              )}
              <div style={{ marginTop: 16 }}>
                <Link href={`/dashboard/study/${set.id}`}>
                  <Button type="primary" size="large">
                    Start studying
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Add card section */}
            <Card title="Add Cards">
              <Tabs items={tabItems} />
            </Card>

            {/* Card list */}
            <Card
              title={<Text strong>Cards ({(set.cards ?? []).length})</Text>}
              extra={
                <Flex gap={8} align="center" justify="flex-end">
                  <Text type="secondary">
                    Đã chọn: <Text strong>{selectedCardIds.length}</Text>
                  </Text>
                  <Popconfirm
                    title={`Xóa ${selectedCardIds.length} thẻ đã chọn?`}
                    description="Hành động này không thể hoàn tác."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDeleteSelectedCards}
                    placement="bottomRight"
                    disabled={selectedCardIds.length === 0}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      disabled={selectedCardIds.length === 0}
                    >
                      Xóa đã chọn
                    </Button>
                  </Popconfirm>
                </Flex>
              }
            >
              {(set.cards ?? []).length === 0 ? (
                <Text type="secondary">Chưa có thẻ — thêm ở trên.</Text>
              ) : (
                <Table
                  size="small"
                  columns={cardColumns}
                  rowSelection={{
                    selectedRowKeys: selectedCardIds,
                    onChange: (keys) => setSelectedCardIds(keys as string[]),
                  }}
                  dataSource={(set.cards ?? []).map((c) => ({
                    ...c,
                    key: c.id,
                  }))}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                  }}
                />
              )}
            </Card>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
