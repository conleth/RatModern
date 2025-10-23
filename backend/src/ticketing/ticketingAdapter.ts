import { UserRole } from "../types/auth.js";

export type LinkRallyPayload = {
  taskId: string;
  workItemId: string;
  metadata?: Record<string, unknown>;
};

export type TicketingContext = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userRole: UserRole;
};

export interface TicketingAdapter {
  readonly name: string;
  exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string }>;
  linkTask(payload: LinkRallyPayload, context: TicketingContext): Promise<void>;
  getWorkItem(workItemId: string, context: TicketingContext): Promise<unknown>;
}

export type AdapterFactory = () => TicketingAdapter;

