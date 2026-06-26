import { httpClient } from "@/utils/http";
import type {
  ChatStats,
  ChatConversation,
  ChatMessage,
  C2CConversation,
  C2CMessage,
  C2CMember,
} from "./schemas";

export const CHAT_ENDPOINTS = {
  stats: "/api/admin/chat/stats",
  conversations: "/api/admin/chat/conversations",
  history: (id: number) => `/api/admin/chat/conversations/${id}/history`,
  c2cConversations: "/api/admin/chat/c2c/conversations",
  c2cMessages: (id: number) => `/api/admin/chat/c2c/conversations/${id}/messages`,
  c2cMembers: (id: number) => `/api/admin/chat/c2c/conversations/${id}/members`,
};

export const chatApi = {
  getStats: (): Promise<ChatStats> => httpClient.get(CHAT_ENDPOINTS.stats),

  getConversations: (
    params?: Record<string, string | number | null | undefined>,
  ): Promise<ChatConversation[]> => httpClient.get(CHAT_ENDPOINTS.conversations, { params }),

  getHistory: (
    id: number,
    params?: Record<string, string | number | null | undefined>,
  ): Promise<ChatMessage[]> => httpClient.get(CHAT_ENDPOINTS.history(id), { params }),

  getC2CConversations: (
    params?: Record<string, string | number | null | undefined>,
  ): Promise<C2CConversation[]> => httpClient.get(CHAT_ENDPOINTS.c2cConversations, { params }),

  getC2CMessages: (
    id: number,
    params?: Record<string, string | number | null | undefined>,
  ): Promise<C2CMessage[]> => httpClient.get(CHAT_ENDPOINTS.c2cMessages(id), { params }),

  getC2CMembers: (id: number): Promise<C2CMember[]> =>
    httpClient.get(CHAT_ENDPOINTS.c2cMembers(id)),
};
