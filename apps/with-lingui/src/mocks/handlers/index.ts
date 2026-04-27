import { authHandlers } from "./auth";
import { userHandlers } from "./user";
import { ordersHandlers } from "./orders";

export const handlers = [...authHandlers, ...userHandlers, ...ordersHandlers];
