import { authHandlers } from "./auth";
import { userHandlers } from "./user";
import { activityHandlers } from "./activity";
import { chatHandlers } from "./chat";

export const handlers = [...authHandlers, ...userHandlers, ...activityHandlers, ...chatHandlers];
