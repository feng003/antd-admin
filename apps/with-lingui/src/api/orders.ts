import type { CreateOrderRequest, UpdateOrderRequest, Order } from "./schemas";

export const ORDER_ENDPOINTS = {
  list: "/api/orders",
  create: "/api/orders",
  update: (id: string) => `/api/orders/${id}`,
  delete: (id: string) => `/api/orders/${id}`,
} as const;

export type { CreateOrderRequest, UpdateOrderRequest, Order };
