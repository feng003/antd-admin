import {
  Avatar,
  Badge,
  Button,
  Col,
  Descriptions,
  Drawer,
  Flex,
  Row,
  Spin,
  Tag,
  Tabs,
  Typography,
  theme,
} from "antd";
import { ChevronUp, Crown, Shield, User, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import type { C2CConversation, C2CMessage } from "@/api/schemas";

const { Text, Title } = Typography;

// ── Helpers ────────────────────────────────────────────────────

const ROLE_ICON: Record<number, React.ReactNode> = {
  1: <Crown size={12} style={{ color: "#f59e0b" }} />,
  2: <Shield size={12} style={{ color: "#6366f1" }} />,
  3: <User size={12} style={{ color: "#94a3b8" }} />,
};

const ROLE_LABEL: Record<number, string> = {
  1: "群主",
  2: "管理员",
  3: "成员",
};

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN");
}

// ── Message Bubble ─────────────────────────────────────────────

function C2CBubble({
  msg,
  memberMap,
  rightSenderId,
}: {
  msg: C2CMessage;
  memberMap: Map<number, string>;
  /** The sender ID that should appear on the RIGHT side */
  rightSenderId: number | undefined;
}) {
  const { token } = theme.useToken();

  const senderName =
    memberMap.size > 0
      ? (memberMap.get(Number(msg.sender_id)) ?? `UID ${msg.sender_id}`)
      : `UID ${msg.sender_id}`;

  const isRight = rightSenderId !== undefined && Number(msg.sender_id) === rightSenderId;

  return (
    <Flex
      justify={isRight ? "flex-end" : "flex-start"}
      align="flex-end"
      gap={token.marginXS}
      style={{ marginBottom: token.marginSM }}
    >
      {!isRight && (
        <Avatar size={28} style={{ flexShrink: 0, background: token.colorPrimary, fontSize: 11 }}>
          {senderName.slice(0, 2).toUpperCase()}
        </Avatar>
      )}

      <Flex vertical align={isRight ? "flex-end" : "flex-start"} style={{ maxWidth: "68%" }}>
        <Text type="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
          {senderName}
        </Text>
        <div
          style={{
            background: isRight ? token.colorPrimary : token.colorBgContainer,
            color: isRight ? "#fff" : token.colorText,
            border: isRight ? "none" : `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            borderBottomRightRadius: isRight ? 2 : token.borderRadiusLG,
            borderBottomLeftRadius: isRight ? token.borderRadiusLG : 2,
            padding: `${token.paddingXS}px ${token.paddingSM}px`,
            wordBreak: "break-word",
            lineHeight: 1.5,
          }}
        >
          {msg.content || (
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              [空消息]
            </Text>
          )}
        </div>
        <Text type="secondary" style={{ fontSize: 10, marginTop: 2 }}>
          {fmtTime(msg.created_at)}
        </Text>
      </Flex>

      {isRight && (
        <Avatar size={28} style={{ flexShrink: 0, background: token.colorSuccess, fontSize: 11 }}>
          {senderName.slice(0, 2).toUpperCase()}
        </Avatar>
      )}
    </Flex>
  );
}

// ── Messages Tab ───────────────────────────────────────────────
// 设计：每次 cursorId 变化获取一批消息，累积到 allMessages 数组中。
// 用 ref 记录已处理过的 (convId, cursorId) 组合，避免重复追加。

function MessagesTab({ convId, memberMap }: { convId: number; memberMap: Map<number, string> }) {
  const { token } = theme.useToken();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Accumulated message pages, in chronological order (oldest first)
  const [allMessages, setAllMessages] = useState<C2CMessage[]>([]);
  // The cursor for "load earlier" — id of oldest visible message (0 = initial)
  const [cursorId, setCursorId] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Track processed pages to avoid double-append
  const processedRef = useRef<Set<string>>(new Set());

  // Reset state when conversation changes
  useEffect(() => {
    setAllMessages([]);
    setCursorId(0);
    setHasMore(true);
    processedRef.current = new Set();
  }, [convId]);

  const {
    data: fetchedPage,
    isFetching,
    isSuccess,
  } = useQuery<C2CMessage[]>({
    queryKey: ["c2c-messages", convId, cursorId],
    queryFn: async () => {
      const result = await chatApi.getC2CMessages(convId, {
        cursor_id: cursorId > 0 ? cursorId : undefined,
        limit: 30,
      });
      return result;
    },
    staleTime: 30_000,
    enabled: convId > 0,
  });

  // Append fetched page to accumulated list
  useEffect(() => {
    if (!isSuccess || !fetchedPage) return;

    const pageKey = `${convId}:${cursorId}`;
    if (processedRef.current.has(pageKey)) return;
    processedRef.current.add(pageKey);

    // API returns newest-first (ORDER BY id DESC). Reverse → chronological (oldest first).
    const chronological = Array.isArray(fetchedPage) ? [...fetchedPage].reverse() : [];

    if (cursorId === 0) {
      // Initial load: replace everything
      setAllMessages(chronological);
      setHasMore(fetchedPage.length === 30);
      // Scroll to bottom on next frame
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    } else {
      // Load earlier: prepend older messages
      setAllMessages((prev) => [...chronological, ...prev]);
      setHasMore(fetchedPage.length === 30);
    }
    // NOTE: cursorId is intentionally NOT in deps — we capture its value correctly
    // because processedRef guards against duplicates instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, fetchedPage, convId]);

  // Determine which sender_id appears on the right (second unique sender in history)
  const rightSenderId = useMemo<number | undefined>(() => {
    if (allMessages.length === 0) return undefined;
    const firstId = Number(allMessages[0].sender_id);
    for (const m of allMessages) {
      if (Number(m.sender_id) !== firstId) return Number(m.sender_id);
    }
    return undefined;
  }, [allMessages]);

  const handleLoadEarlier = () => {
    if (allMessages.length === 0 || !hasMore) return;
    setCursorId(allMessages[0].id);
  };

  const isInitialLoading = isFetching && allMessages.length === 0;

  return (
    <Flex vertical style={{ height: "100%", minHeight: 0 }}>
      {/* Load earlier */}
      <Flex
        justify="center"
        style={{
          padding: `${token.paddingXS}px 0`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<ChevronUp size={14} />}
          loading={isFetching && cursorId > 0}
          onClick={handleLoadEarlier}
          disabled={!hasMore || allMessages.length === 0}
        >
          {hasMore ? "加载更早的消息" : "已加载全部消息"}
        </Button>
      </Flex>

      {/* Message area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: token.paddingMD,
        }}
      >
        {isInitialLoading ? (
          <Flex justify="center" align="center" style={{ minHeight: 200 }}>
            <Spin tip="加载消息中..." />
          </Flex>
        ) : allMessages.length === 0 ? (
          <Flex justify="center" align="center" style={{ minHeight: 200 }}>
            <Text type="secondary">暂无消息记录</Text>
          </Flex>
        ) : (
          allMessages.map((msg) => (
            <C2CBubble key={msg.id} msg={msg} memberMap={memberMap} rightSenderId={rightSenderId} />
          ))
        )}
      </div>
    </Flex>
  );
}

// ── Members Tab ────────────────────────────────────────────────

function MembersTab({ convId }: { convId: number }) {
  const { token } = theme.useToken();

  const { data: members, isFetching } = useQuery({
    queryKey: ["c2c-members", convId],
    queryFn: () => chatApi.getC2CMembers(convId),
    staleTime: 60_000,
    enabled: convId > 0,
  });

  if (isFetching && !members) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 200 }}>
        <Spin />
      </Flex>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 200 }}>
        <Text type="secondary">暂无成员信息</Text>
      </Flex>
    );
  }

  return (
    <Row gutter={[token.marginSM, token.marginSM]} style={{ padding: `${token.paddingSM}px 0` }}>
      {members.map((m) => (
        <Col key={m.user_id} xs={24} sm={12}>
          <Flex
            align="center"
            gap={token.marginSM}
            style={{
              padding: `${token.paddingSM}px ${token.paddingMD}px`,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer,
            }}
          >
            <Avatar
              size={36}
              style={{
                background:
                  m.role === 1 ? "#f59e0b" : m.role === 2 ? "#6366f1" : token.colorPrimary,
                flexShrink: 0,
              }}
            >
              {String(m.name ?? "")
                .slice(0, 2)
                .toUpperCase() || "?"}
            </Avatar>
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ fontSize: token.fontSizeSM }} ellipsis>
                {m.name || `用户 ${m.user_id}`}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                UID: {m.user_id}
              </Text>
            </Flex>
            <Tag
              icon={ROLE_ICON[m.role]}
              color={m.role === 1 ? "gold" : m.role === 2 ? "purple" : "default"}
              style={{ marginRight: 0, flexShrink: 0 }}
            >
              {ROLE_LABEL[m.role] ?? "成员"}
            </Tag>
          </Flex>
        </Col>
      ))}
    </Row>
  );
}

// ── Main Drawer ────────────────────────────────────────────────

export type C2CDetailDrawerProps = {
  conversation: C2CConversation | null;
  open: boolean;
  onClose: () => void;
};

export function C2CDetailDrawer({ conversation, open, onClose }: C2CDetailDrawerProps) {
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState("messages");

  // Reset tab on conversation change
  useEffect(() => {
    if (conversation?.id) setActiveTab("messages");
  }, [conversation?.id]);

  // Pre-fetch member map for bubble display
  const { data: members } = useQuery({
    queryKey: ["c2c-members", conversation?.id ?? 0],
    queryFn: () => chatApi.getC2CMembers(conversation!.id),
    enabled: open && !!conversation && conversation.id > 0,
    staleTime: 60_000,
  });

  const memberMap = useMemo(
    () =>
      new Map<number, string>(
        (members ?? []).map((m) => [Number(m.user_id), String(m.name ?? "")]),
      ),
    [members],
  );

  if (!conversation) return null;

  const isGroup = conversation.type_label === "group";
  const convTitle = isGroup
    ? conversation.name || `群聊 #${conversation.id}`
    : `私聊 #${conversation.id}`;

  return (
    <Drawer
      title={
        <Flex align="center" gap={token.marginSM}>
          {isGroup ? (
            <Avatar
              size={30}
              icon={<Users size={15} />}
              style={{ background: "#7c3aed", flexShrink: 0 }}
            />
          ) : (
            <Avatar
              size={30}
              style={{ background: token.colorPrimary, fontSize: 12, flexShrink: 0 }}
            >
              DM
            </Avatar>
          )}
          <Flex vertical gap={0} style={{ minWidth: 0 }}>
            <Title level={5} style={{ margin: 0, fontSize: 14 }} ellipsis>
              {convTitle}
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {isGroup ? `群聊 · ${conversation.member_count} 人` : "私聊"}
            </Text>
          </Flex>
        </Flex>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* Metadata bar */}
      <div
        style={{
          padding: `${token.paddingSM}px ${token.paddingMD}px`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          flexShrink: 0,
        }}
      >
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="会话 ID">
            <Text strong>#{conversation.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            {isGroup ? (
              <Tag color="purple" icon={<Users size={10} style={{ marginRight: 3 }} />}>
                群聊
              </Tag>
            ) : (
              <Tag color="cyan">私聊</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="参与人数">
            <Badge status="processing" text={`${conversation.member_count} 人`} />
          </Descriptions.Item>
          <Descriptions.Item label="最后消息">
            <Text type="secondary" style={{ fontSize: 11 }}>
              {fmtDateTime(conversation.last_msg_at)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {fmtDateTime(conversation.created_at)}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        tabBarStyle={{ margin: 0, paddingLeft: token.paddingMD, flexShrink: 0 }}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        items={[
          {
            key: "messages",
            label: "消息记录",
            children: (
              <div
                style={{
                  height: "calc(100dvh - 350px)",
                  minHeight: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {open && conversation.id > 0 && (
                  <MessagesTab convId={conversation.id} memberMap={memberMap} />
                )}
              </div>
            ),
          },
          {
            key: "members",
            label: isGroup
              ? `成员 (${conversation.member_count})`
              : `参与者 (${conversation.member_count})`,
            children: (
              <div
                style={{
                  maxHeight: "calc(100dvh - 350px)",
                  overflowY: "auto",
                  padding: `0 ${token.paddingMD}px`,
                }}
              >
                {open && conversation.id > 0 && <MembersTab convId={conversation.id} />}
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
