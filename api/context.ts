import type { User } from "@db/schema";

export interface TrpcContext {
  user?: User;
}
