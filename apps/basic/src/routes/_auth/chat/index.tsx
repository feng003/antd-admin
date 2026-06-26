import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Card,
  Col,
  Flex,
  Row,
  Segmented,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { MessageSquare, Clock, Activity, CheckCircle, Users, MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import type { ChatConversation, C2CConversation } from "@/api/schemas";
import { DataTable } from "@/components/DataTable";
import { useTableFitHeight } from "@/hooks/useTableFitHeight";
import type { ChatDateRange } from "./-Toolbar";
import { Toolbar } from "./-Toolbar";
import { MessageDrawer } from "./-MessageDrawer";
import { C2CDetailDrawer } from "./-C2CDetailDrawer";

const { Text } = Typography;

// ── Route ──────────────────────────────────────────────────────

export const Route = createFileRoute("/_auth/chat/")({
  component: ChatPage,
});

// ── Types ──────────────────────────────────────────────────────

type ChatMode = "cs" | "direct" | "group";

// ── Status / Priority helpers ──────────────────────────────────

const STATUS_TAG: Record<string, React.ReactNode> = {
  waiting: <Tag color="orange">Waiting</Tag>,
  active: <Tag color="blue">Active</Tag>,
  resolved: <Tag color="green">Resolved</Tag>,
};

const PRIORITY_TAG: Record<string, React.ReactNode> = {
  low: <Tag color="default">Low</Tag>,
  normal: <Tag color="blue">Normal</Tag>,
  high: <Tag color="red">High</Tag>,
};

// ── Stats Card ─────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
}) {
  const { token } = theme.useToken();
  return (
    <Card
      style={{ borderRadius: token.borderRadiusLG, overflow: "hidden" }}
      styles={{ body: { padding: `${token.paddingMD}px ${token.paddingLG}px` } }}
    >
      <Flex align="center" gap={token.marginMD}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 48,
            height: 48,
            borderRadius: token.borderRadiusLG,
            background: color + "1a",
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Flex>
        <Statistic title={title} value={value ?? "—"} valueStyle={{ color, fontSize: 24 }} />
      </Flex>
    </Card>
  );
}

// ── C2C Conversations Table ─────────────────────────────────────

function C2CConversationsTable({
  mode,
  tableAreaMaxHeight,
  tableScrollY,
  lockScrollHeight,
  middleRef,
  tableFrameRef,
}: {
  mode: ChatMode;
  tableAreaMaxHeight: number | undefined;
  tableScrollY: number | undefined;
  lockScrollHeight: boolean;
  middleRef: React.RefObject<HTMLDivElement | null>;
  tableFrameRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { token } = theme.useToken();
  const [cursorId, setCursorId] = useState(0);
  const [selectedC2C, setSelectedC2C] = useState<C2CConversation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const convType = mode === "direct" ? 1 : mode === "group" ? 2 : 0;

  const { data: conversations, isFetching } = useQuery({
    queryKey: ["chat-c2c-conversations", convType, cursorId],
    queryFn: () =>
      chatApi.getC2CConversations({
        type: convType,
        cursor_id: cursorId || undefined,
        limit: 20,
      }),
    staleTime: 10_000,
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "Type",
      dataIndex: "type_label",
      key: "type",
      width: 90,
      render: (v: string) =>
        v === "group" ? (
          <Tag icon={<Users size={10} style={{ marginRight: 3 }} />} color="purple">
            Group
          </Tag>
        ) : (
          <Tag color="cyan">Direct</Tag>
        ),
    },
    {
      title: "Name / Members",
      key: "name",
      width: 200,
      render: (_: unknown, row: C2CConversation) => (
        <Flex vertical gap={0}>
          {row.name ? (
            <Text strong style={{ fontSize: token.fontSizeSM }}>
              {row.name}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              Direct Chat
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 11 }}>
            {row.member_count} member{row.member_count !== 1 ? "s" : ""}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Last Message",
      dataIndex: "last_msg_at",
      key: "last_msg_at",
      width: 160,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={new Date(v).toLocaleString()}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {new Date(v).toLocaleString()}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {new Date(v).toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <>
      <DataTable
        layoutRef={middleRef}
        frameRef={tableFrameRef}
        lockScrollHeight={lockScrollHeight}
        maxHeight={tableAreaMaxHeight ?? undefined}
        frameHeight={tableAreaMaxHeight ?? undefined}
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={conversations ?? []}
        loading={isFetching}
        scroll={tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }}
        onRow={(row) => ({
          onClick: () => {
            setSelectedC2C(row as C2CConversation);
            setDrawerOpen(true);
          },
          style: { cursor: "pointer" },
        })}
        footer={
          conversations && conversations.length >= 20
            ? () => (
                <Flex justify="center" align="center" gap={4}>
                  <MessageCircle size={14} style={{ opacity: 0.5 }} />
                  <Text
                    type="secondary"
                    style={{ fontSize: token.fontSizeSM, cursor: "pointer" }}
                    onClick={() => {
                      const last = conversations[conversations.length - 1];
                      if (last) setCursorId(last.id);
                    }}
                  >
                    Load more →
                  </Text>
                </Flex>
              )
            : undefined
        }
      />
      <C2CDetailDrawer
        conversation={selectedC2C}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────

function ChatPage() {
  const { token } = theme.useToken();

  // Tab mode
  const [mode, setMode] = useState<ChatMode>("cs");

  // CS filters
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState<ChatDateRange>(null);
  const [cursorId, setCursorId] = useState(0);

  // CS Drawer
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Layout refs
  const pageShellRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);

  // ── Stats Query ──
  const { data: stats } = useQuery({
    queryKey: ["chat-stats"],
    queryFn: () => chatApi.getStats(),
    staleTime: 30_000,
    enabled: mode === "cs",
  });

  // ── CS Conversations Query ──
  const startTime = dateRange?.[0] ?? undefined;
  const endTime = dateRange?.[1] ?? undefined;

  const {
    data: conversations,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["chat-conversations", status, cursorId, startTime, endTime],
    queryFn: () =>
      chatApi.getConversations({
        status: status || undefined,
        cursor_id: cursorId || undefined,
        limit: 20,
        start_time: startTime,
        end_time: endTime,
      }),
    staleTime: 10_000,
    enabled: mode === "cs",
  });

  const { tableAreaMaxHeight, tableScrollY, lockScrollHeight } = useTableFitHeight({
    pageShellRef,
    toolbarRef: statsRef,
    middleRef,
    tableFrameRef,
    marginLG: token.marginLG,
    rowCount: conversations?.length ?? 0,
    isLoading: isFetching,
    showPagination: false,
  });

  // ── CS Columns ──
  const csColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "User",
      key: "user",
      width: 160,
      render: (_: unknown, row: ChatConversation) => (
        <Flex vertical gap={0}>
          <Text strong style={{ fontSize: token.fontSizeSM }}>
            {row.user_name ?? `UID ${row.user_id}`}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ID: {row.user_id}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) => STATUS_TAG[v] ?? <Tag>{v}</Tag>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 90,
      render: (v: string) => PRIORITY_TAG[v] ?? <Tag>{v}</Tag>,
    },
    {
      title: "Agent ID",
      dataIndex: "assigned_agent_id",
      key: "assigned_agent_id",
      width: 90,
      render: (v: number | null) =>
        v != null ? <Badge status="success" text={`#${v}`} /> : <Text type="secondary">—</Text>,
    },
    {
      title: "Last Message",
      dataIndex: "last_message_at",
      key: "last_message_at",
      width: 160,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString()}>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {new Date(v).toLocaleString()}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {new Date(v).toLocaleString()}
        </Text>
      ),
    },
  ];

  const handleRowClick = (row: ChatConversation) => {
    setSelectedConv(row);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    setCursorId(0);
    void refetch();
  };

  return (
    <Flex
      ref={pageShellRef}
      vertical
      gap={token.marginMD}
      style={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}
    >
      {/* ── Top: Mode Segmented Switch ── */}
      <div ref={statsRef}>
        <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
          <Segmented<ChatMode>
            size="large"
            value={mode}
            onChange={setMode}
            options={[
              {
                label: (
                  <Flex align="center" gap={6}>
                    <MessageSquare size={15} />
                    <span>客服系统</span>
                  </Flex>
                ),
                value: "cs",
              },
              {
                label: (
                  <Flex align="center" gap={6}>
                    <MessageCircle size={15} />
                    <span>单聊</span>
                  </Flex>
                ),
                value: "direct",
              },
              {
                label: (
                  <Flex align="center" gap={6}>
                    <Users size={15} />
                    <span>群聊</span>
                  </Flex>
                ),
                value: "group",
              },
            ]}
          />
        </Flex>

        {/* Stats Cards — only visible on CS tab */}
        {mode === "cs" && (
          <Row gutter={[token.marginMD, token.marginMD]} style={{ marginBottom: token.marginMD }}>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Total Conversations"
                value={stats?.total}
                icon={<MessageSquare size={22} />}
                color={token.colorPrimary}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Waiting"
                value={stats?.total_waiting}
                icon={<Clock size={22} />}
                color={token.colorWarning}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Active"
                value={stats?.total_active}
                icon={<Activity size={22} />}
                color={token.colorInfo}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatsCard
                title="Resolved"
                value={stats?.total_resolved}
                icon={<CheckCircle size={22} />}
                color={token.colorSuccess}
              />
            </Col>
          </Row>
        )}

        {/* Toolbar — only on CS tab */}
        {mode === "cs" && (
          <Toolbar
            ref={toolbarRef}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setCursorId(0);
            }}
            dateRange={dateRange}
            onDateRangeChange={(r) => {
              setDateRange(r);
              setCursorId(0);
            }}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* ── CS: Conversation Table ── */}
      {mode === "cs" && (
        <>
          <DataTable
            layoutRef={middleRef}
            frameRef={tableFrameRef}
            lockScrollHeight={lockScrollHeight}
            maxHeight={tableAreaMaxHeight ?? undefined}
            frameHeight={tableAreaMaxHeight ?? undefined}
            rowKey="id"
            size="small"
            columns={csColumns}
            dataSource={conversations ?? []}
            loading={isFetching}
            scroll={
              tableScrollY != null ? { x: "max-content", y: tableScrollY } : { x: "max-content" }
            }
            onRow={(row) => ({
              onClick: () => handleRowClick(row as ChatConversation),
              style: { cursor: "pointer" },
            })}
            footer={
              conversations && conversations.length >= 20
                ? () => (
                    <Flex justify="center" align="center" gap={4}>
                      <MessageCircle size={14} style={{ opacity: 0.5 }} />
                      <Text
                        type="secondary"
                        style={{ fontSize: token.fontSizeSM, cursor: "pointer" }}
                        onClick={() => {
                          const last = conversations[conversations.length - 1];
                          if (last) setCursorId(last.id);
                        }}
                      >
                        Load more conversations →
                      </Text>
                    </Flex>
                  )
                : undefined
            }
          />
          <MessageDrawer
            conversation={selectedConv}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        </>
      )}

      {/* ── C2C: Direct / Group Chat Tables ── */}
      {(mode === "direct" || mode === "group") && (
        <C2CConversationsTable
          mode={mode}
          tableAreaMaxHeight={tableAreaMaxHeight ?? undefined}
          tableScrollY={tableScrollY ?? undefined}
          lockScrollHeight={lockScrollHeight}
          middleRef={middleRef}
          tableFrameRef={tableFrameRef}
        />
      )}
    </Flex>
  );
}
