"use client";

import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Typography,
} from "@/components/antd-ui";

const { Text } = Typography;

export interface SetsFilterBarProps {
  q: string;
  onQChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  onReset: () => void;
}

export function SetsFilterBar({
  q,
  onQChange,
  language,
  onLanguageChange,
  onReset,
}: SetsFilterBarProps) {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={10}>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 4, fontSize: 12 }}
          >
            Search by title
          </Text>
          <Input
            allowClear
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="e.g., Hiragana, HSK 1, Food…"
          />
        </Col>
        <Col xs={24} md={8}>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 4, fontSize: 12 }}
          >
            Language
          </Text>
          <Select
            style={{ width: "100%" }}
            value={language || undefined}
            placeholder="All languages"
            allowClear
            onChange={(val) => onLanguageChange(val ?? "")}
            options={[
              { value: "Japanese", label: "Japanese" },
              { value: "Chinese", label: "Chinese" },
            ]}
          />
        </Col>
        <Col xs={24} md={6} style={{ paddingTop: 20 }}>
          <Button onClick={onReset} block>
            Reset
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
