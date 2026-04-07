"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
} from "@/components/antd-ui";
import { setsApiClient, ApiError } from "@/lib/api";
import { DashboardShell } from "../../_components/dashboard-shell";

const { Title } = Typography;

interface CreateFormValues {
  title: string;
  description?: string;
  language: string;
  visibility: "public" | "private";
}

export default function CreateSetPage() {
  const router = useRouter();
  const [form] = Form.useForm<CreateFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: CreateFormValues) => {
    setSubmitting(true);
    try {
      const created = await setsApiClient.create({
        title: values.title.trim(),
        description: values.description?.trim() ?? "",
        language: values.language,
        isPublic: values.visibility === "public",
        cards: [],
      });
      router.push(`/dashboard/sets/${created.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Something went wrong";
      form.setFields([{ name: "title", errors: [msg] }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell active="sets">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Title level={3} style={{ marginBottom: 32 }}>
          Create New Study Set
        </Title>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ language: "Japanese", visibility: "private" }}
          >
            <Form.Item
              label="Set Title"
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="e.g., Japanese Hiragana" />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea
                rows={4}
                placeholder="Describe what learners will study in this set"
              />
            </Form.Item>

            <Form.Item
              label="Language"
              name="language"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "Japanese", label: "Japanese" },
                  { value: "Chinese", label: "Chinese" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Visibility"
              name="visibility"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "private", label: "Private" },
                  { value: "public", label: "Public" },
                ]}
              />
            </Form.Item>

            {/* Global error shown as Alert if needed */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldError }) => {
                const err = getFieldError("title").find((e) =>
                  e.includes("went wrong"),
                );
                return err ? (
                  <Alert
                    type="error"
                    message={err}
                    style={{ marginBottom: 16 }}
                  />
                ) : null;
              }}
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ marginRight: 12 }}
              >
                Create Set
              </Button>
              <Link href="/dashboard/sets">
                <Button>Cancel</Button>
              </Link>
            </Form.Item>
          </Form>
        </Card>
      </main>
    </DashboardShell>
  );
}
