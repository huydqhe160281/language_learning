"use client";

import { Card, Typography } from "@/components/antd-ui";

const { Text } = Typography;

export interface DueTodayBannerProps {
  dueToday: number;
}

export function DueTodayBanner({ dueToday }: DueTodayBannerProps) {
  if (dueToday <= 0) return null;

  return (
    <Card
      style={{
        marginBottom: 24,
        background: "#fff7ed",
        borderColor: "#fed7aa",
      }}
    >
      <Text strong style={{ color: "#c2410c" }}>
        🔔 Bạn có {dueToday} thẻ đến hạn ôn tập hôm nay!
      </Text>
    </Card>
  );
}
