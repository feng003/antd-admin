import {
  Avatar,
  Badge,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Spin,
  Tag,
  Typography,
  theme,
} from "antd";
import { ChevronUp, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import type { ChatConversation, ChatMessage } from "@/api/schemas";

const { Text, Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  waiting: "orange",
  active: "blue",
  resolved: "green",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "default",
  normal: "processing",
  high: "error",
};

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const { token } = theme.useToken();
  const isAgent = msg.sender_type === "agent";
  const isSystem = msg.sender_type === "system";

  if (isSystem) {
    return (
      <Flex justify="center" style={{ marginBottom: token.marginSM }}>
        <Text type="secondary" style={{ fontSize: token.fontSizeSM, fontStyle: "italic" }}>
          {msg.content}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      justify={isAgent ? "flex-end" : "flex-start"}
      align="flex-end"
      gap={token.marginXS}
      style={{ marginBottom: token.marginSM }}
    >
      {!isAgent && (
        <Avatar
          size={28}
          icon={<UserCircle size={16} />}
          style={{ flexShrink: 0, background: token.colorPrimary }}
        />
      )}
      <Flex vertical align={isAgent ? "flex-end" : "flex-start"} style={{ maxWidth: "72%" }}>
        <div
          style={{
            background: isAgent ? token.colorPrimary : token.colorBgContainer,
            color: isAgent ? "#fff" : token.colorText,
            border: isAgent ? "none" : `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            borderBottomRightRadius: isAgent ? 2 : token.borderRadiusLG,
            borderBottomLeftRadius: isAgent ? token.borderRadiusLG : 2,
            padding: `${token.paddingXS}px ${token.paddingSM}px`,
            wordBreak: "break-word",
          }}
        >
          {msg.content}
        </div>
        <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
          {new Date(msg.created_at).toLocaleTimeString()}
        </Text>
      </Flex>
      {isAgent && (
        <Avatar size={28} style={{ flexShrink: 0, background: token.colorSuccess }}>
          CS
        </Avatar>
      )}
    </Flex>
  );
}

export type MessageDrawerProps = {
  conversation: ChatConversation | null;
  open: boolean;
  onClose: () => void;
};

export function MessageDrawer({ conversation, open, onClose }: MessageDrawerProps) {
  const { token } = theme.useToken();
  const [cursorId, setCursorId] = useState(0);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when conversation changes
  useEffect(() => {
    setCursorId(0);
    setAllMessages([]);
  }, [conversation?.id]);

  const { data: newMessages, isFetching } = useQuery({
    queryKey: ["chat-history", conversation?.id, cursorId],
    queryFn: () =>
      chatApi.getHistory(conversation!.id, { cursor_id: cursorId || undefined, limit: 30 }),
    enabled: open && conversation != null,
    staleTime: 0,
  });

  // Prepend older messages when cursor changes
  useEffect(() => {
    if (!newMessages) return;
    if (cursorId === 0) {
      setAllMessages(newMessages);
      // Scroll to bottom on initial load
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    } else {
      setAllMessages((prev) => [...newMessages, ...prev]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessages]);

  const handleLoadMore = () => {
    if (allMessages.length > 0) {
      setCursorId(allMessages[0].id);
    }
  };

  if (!conversation) return null;

  return (
    <Drawer
      title={
        <Flex align="center" gap={token.marginSM}>
          <Title level={5} style={{ margin: 0 }}>
            Conversation #{conversation.id}
          </Title>
          <Badge
            status={
              conversation.status === "active"
                ? "processing"
                : conversation.status === "waiting"
                  ? "warning"
                  : "success"
            }
          />
          <Tag color={STATUS_COLOR[conversation.status]}>{conversation.status}</Tag>
        </Flex>
      }
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      {/* ── Conversation Info ── */}
      <div
        style={{
          padding: `${token.paddingSM}px ${token.paddingMD}px`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
        }}
      >
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="User">
            <Flex align="center" gap={4}>
              {conversation.user_avatar ? (
                <Avatar size={18} src={conversation.user_avatar} />
              ) : (
                <Avatar size={18} icon={<UserCircle size={12} />} />
              )}
              <Text>{conversation.user_name ?? `UID ${conversation.user_id}`}</Text>
            </Flex>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={PRIORITY_COLOR[conversation.priority]}>{conversation.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Agent ID">
            {conversation.assigned_agent_id ?? <Text type="secondary">Unassigned</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Last Msg">
            <Text type="secondary">{new Date(conversation.last_message_at).toLocaleString()}</Text>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* ── Load More ── */}
      {allMessages.length > 0 && (
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
            onClick={handleLoadMore}
          >
            Load earlier messages
          </Button>
        </Flex>
      )}

      {/* ── Message List ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: token.paddingMD,
        }}
      >
        {isFetching && cursorId === 0 ? (
          <Flex justify="center" align="center" style={{ height: "100%" }}>
            <Spin />
          </Flex>
        ) : allMessages.length === 0 ? (
          <Flex
            justify="center"
            align="center"
            style={{ height: "100%", color: token.colorTextQuaternary }}
          >
            No messages
          </Flex>
        ) : (
          allMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
      </div>
    </Drawer>
  );
}
