"use client";

import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useCallback, useState } from "react";
import {
  App,
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Upload,
} from "@/components/antd-ui";
import { setsApiClient, ApiError } from "@/lib/api";
import { parseCSV, type ParsedCard } from "./csv-parse";

const { Text } = Typography;
const { Dragger } = Upload;

export interface CsvImportPanelProps {
  setId: string;
  onImported: () => void;
}

export function CsvImportPanel({ setId, onImported }: CsvImportPanelProps) {
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
      return false;
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
