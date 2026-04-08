"use client";

import { Card, Col, Row, Statistic } from "@/components/antd-ui";

export interface ProgressSummaryStatsProps {
  totalCards: number;
  studiedCards: number;
  unstudiedCards: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallMasteryPct: number;
}

export function ProgressSummaryStats({
  totalCards,
  studiedCards,
  unstudiedCards,
  totalCorrect,
  totalIncorrect,
  overallMasteryPct,
}: ProgressSummaryStatsProps) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
      <Col xs={12} md={4}>
        <Card>
          <Statistic title="Tổng thẻ" value={totalCards} prefix="📚" />
        </Card>
      </Col>
      <Col xs={12} md={4}>
        <Card>
          <Statistic
            title="Đã học"
            value={studiedCards}
            prefix="✓"
            valueStyle={{ color: "#16a34a" }}
          />
        </Card>
      </Col>
      <Col xs={12} md={4}>
        <Card>
          <Statistic
            title="Chưa học"
            value={unstudiedCards}
            prefix="○"
            valueStyle={{
              color: unstudiedCards > 0 ? "#dc2626" : "#6b7280",
            }}
          />
        </Card>
      </Col>
      <Col xs={12} md={4}>
        <Card>
          <Statistic
            title="Đúng"
            value={totalCorrect}
            prefix="✓"
            valueStyle={{ color: "#16a34a" }}
          />
        </Card>
      </Col>
      <Col xs={12} md={4}>
        <Card>
          <Statistic
            title="Sai"
            value={totalIncorrect}
            prefix="✗"
            valueStyle={{ color: "#dc2626" }}
          />
        </Card>
      </Col>
      <Col xs={12} md={4}>
        <Card>
          <Statistic
            title="Độ thành thạo"
            value={overallMasteryPct}
            suffix="%"
            prefix="🎯"
            valueStyle={{ color: "#7c3aed" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
