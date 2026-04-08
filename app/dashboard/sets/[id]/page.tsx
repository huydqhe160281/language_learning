"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeleteOutlined, EditOutlined, LeftOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Popconfirm,
  Table,
  Tabs,
  Typography,
} from "@/components/antd-ui";
import { CsvImportPanel } from "@/components/dashboard/sets/csv-import-panel";
import {
  EditCardModal,
  type EditCardFormValues,
} from "@/components/dashboard/sets/edit-card-modal";
import {
  EditSetModal,
  type EditSetFormValues,
} from "@/components/dashboard/sets/edit-set-modal";
import { buildSetDetailCardColumns } from "@/components/dashboard/sets/set-detail-card-table-columns";
import {
  setsApiClient,
  StudySet,
  Card as StudyCard,
  ApiError,
} from "@/lib/api";
import { DashboardShell } from "../../_components/dashboard-shell";

const { Title, Text } = Typography;

export default function SetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [set, setSet] = useState<StudySet | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsPageSize, setCardsPageSize] = useState(20);

  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editSetForm] = Form.useForm<EditSetFormValues>();
  const [editCardForm] = Form.useForm<EditCardFormValues>();
  const loadingRef = useRef(false);

  const [editSetOpen, setEditSetOpen] = useState(false);
  const [editSetLoading, setEditSetLoading] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [editCardLoading, setEditCardLoading] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

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
    setCardsPage(1);
    setCardsPageSize(20);
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

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
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
    },
    [id, message],
  );

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

  const openEditSetModal = () => {
    if (!set) return;
    editSetForm.setFieldsValue({
      title: set.title,
      description: set.description ?? "",
      language: set.language,
      visibility: set.isPublic ? "public" : "private",
    });
    setEditSetOpen(true);
  };

  const handleSaveSet = async () => {
    if (!set) return;
    try {
      const values = await editSetForm.validateFields();
      setEditSetLoading(true);
      const desc = values.description?.trim();
      const updated = await setsApiClient.update(id, {
        title: values.title.trim(),
        description: desc ? desc : null,
        language: values.language,
        isPublic: values.visibility === "public",
      });
      setSet(updated);
      message.success("Đã cập nhật bộ từ");
      setEditSetOpen(false);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields: unknown }).errorFields)
      ) {
        throw err;
      }
      message.error(err instanceof ApiError ? err.message : "Không thể lưu");
      throw err instanceof Error ? err : new Error("Không thể lưu");
    } finally {
      setEditSetLoading(false);
    }
  };

  const openEditCardModal = useCallback(
    (card: StudyCard) => {
      setEditingCardId(card.id);
      editCardForm.setFieldsValue({
        front: card.front,
        back: card.back,
        example: card.example ?? "",
      });
      setEditCardOpen(true);
    },
    [editCardForm],
  );

  const closeEditCardModal = () => {
    setEditCardOpen(false);
    setEditingCardId(null);
    editCardForm.resetFields();
  };

  const handleSaveCard = async () => {
    if (!editingCardId) return;
    try {
      const values = await editCardForm.validateFields();
      setEditCardLoading(true);
      const ex = values.example?.trim();
      const updated = await setsApiClient.updateCard(id, editingCardId, {
        front: values.front.trim(),
        back: values.back.trim(),
        example: ex ? ex : null,
      });
      setSet((prev) =>
        prev
          ? {
              ...prev,
              cards: (prev.cards ?? []).map((c) =>
                c.id === updated.id ? updated : c,
              ),
            }
          : prev,
      );
      message.success("Đã cập nhật thẻ");
      closeEditCardModal();
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "errorFields" in err &&
        Array.isArray((err as { errorFields: unknown }).errorFields)
      ) {
        throw err;
      }
      message.error(err instanceof ApiError ? err.message : "Không thể lưu");
      throw err instanceof Error ? err : new Error("Không thể lưu");
    } finally {
      setEditCardLoading(false);
    }
  };

  const cardColumns = useMemo(
    () =>
      buildSetDetailCardColumns({
        onEditCard: openEditCardModal,
        onDeleteCard: (cardId) => {
          void handleDeleteCard(cardId);
        },
      }),
    [openEditCardModal, handleDeleteCard],
  );

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
            <Card
              extra={
                <Flex gap={8} wrap="wrap" justify="flex-end">
                  <Button icon={<EditOutlined />} onClick={openEditSetModal}>
                    Chỉnh sửa bộ từ
                  </Button>
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
                </Flex>
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

            <Card title="Add Cards">
              <Tabs items={tabItems} />
            </Card>

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
                    current: cardsPage,
                    pageSize: cardsPageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    onChange: (page, size) => {
                      setCardsPage(page);
                      setCardsPageSize(size);
                    },
                    onShowSizeChange: (_page, size) => {
                      setCardsPage(1);
                      setCardsPageSize(size);
                    },
                  }}
                />
              )}
            </Card>

            <EditSetModal
              open={editSetOpen}
              onCancel={() => setEditSetOpen(false)}
              onOk={handleSaveSet}
              form={editSetForm}
              confirmLoading={editSetLoading}
            />

            <EditCardModal
              open={editCardOpen}
              onCancel={closeEditCardModal}
              onOk={handleSaveCard}
              form={editCardForm}
              confirmLoading={editCardLoading}
            />
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
