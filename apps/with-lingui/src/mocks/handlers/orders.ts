import { http } from "msw";
import { OrderSchema } from "@/api/schemas";
import { MOCK_ORDERS } from "../data";
import { paginateList, parsePaginationParams } from "../utils";
import {
  withDelay,
  errorResponse,
  ERROR_CODES,
  paginatedWithSchema,
  successWithSchema,
  successWithNullBody,
} from "../createHandler";

let rows = [...MOCK_ORDERS];

function filterRows(items: typeof rows, keyword: string) {
  if (!keyword.trim()) return items;
  const k = keyword.toLowerCase();
  return items.filter((r) => r.title.toLowerCase().includes(k));
}

export const ordersHandlers = [
  http.get("/api/orders", async ({ request }) => {
    await withDelay(150);
    const url = new URL(request.url);
    const { limit, offset } = parsePaginationParams(url.searchParams);
    const keyword = url.searchParams.get("keyword") ?? "";
    const filtered = filterRows(rows, keyword);
    const list = paginateList(filtered, limit, offset);
    return paginatedWithSchema(OrderSchema, { list, total: filtered.length });
  }),

  http.post("/api/orders", async ({ request }) => {
    await withDelay(150);
    const body = (await request.json()) as Record<string, unknown>;
    const next: (typeof rows)[number] = {
      id: String(rows.length + 1),
      title: typeof body.title === "string" ? body.title : "",
      status: (body.status as (typeof rows)[number]["status"]) ?? "draft",
    };
    rows.push(next);
    return successWithSchema(OrderSchema, next);
  }),

  http.put("/api/orders/:id", async ({ params, request }) => {
    await withDelay(150);
    const body = (await request.json()) as Record<string, unknown>;
    const idx = rows.findIndex((r) => r.id === params.id);
    if (idx === -1) {
      return errorResponse(ERROR_CODES.NOT_FOUND, "Not found");
    }
    rows[idx] = { ...rows[idx], ...body } as (typeof rows)[number];
    return successWithSchema(OrderSchema, rows[idx]);
  }),

  http.delete("/api/orders/:id", async ({ params }) => {
    await withDelay(150);
    rows = rows.filter((r) => r.id !== params.id);
    return successWithNullBody();
  }),
];
