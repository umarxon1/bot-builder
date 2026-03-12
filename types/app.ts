import type { Database, Json } from "@/types/database";

export type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
export type BotRow = Database["public"]["Tables"]["bots"]["Row"];
export type BotConnectionRow = Database["public"]["Tables"]["bot_connections"]["Row"];
export type FlowRow = Database["public"]["Tables"]["bot_flows"]["Row"];
export type FlowNodeRow = Database["public"]["Tables"]["flow_nodes"]["Row"];
export type FlowButtonRow = Database["public"]["Tables"]["flow_buttons"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type BroadcastRow = Database["public"]["Tables"]["broadcasts"]["Row"];
export type InteractionLogRow = Database["public"]["Tables"]["interaction_logs"]["Row"];
export type BotUserRow = Database["public"]["Tables"]["bot_users"]["Row"];

export type FlowNodeType = Database["public"]["Enums"]["flow_node_type"];
export type FlowButtonKind = Database["public"]["Enums"]["flow_button_kind"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type BroadcastStatus = Database["public"]["Enums"]["broadcast_status"];

export type FlowNodeConfig = {
  nextNodeId?: string | null;
  successMessage?: string | null;
  productName?: string | null;
  url?: string | null;
  buttonLabel?: string | null;
};

export type BotSessionState = {
  pendingAction?:
    | "lead_capture_name"
    | "lead_capture_phone"
    | "order_form_name"
    | "order_form_phone"
    | "order_form_note";
  nodeId?: string;
  lead?: {
    fullName?: string;
  };
  order?: {
    productName?: string;
    customerName?: string;
    phone?: string;
  };
};

export type WorkspaceContext = {
  userId: string;
  email: string;
  fullName: string | null;
  workspace: WorkspaceRow;
  bot: (BotRow & { connection?: BotConnectionRow | null }) | null;
};

export type FlowNodeWithButtons = FlowNodeRow & {
  buttons: FlowButtonRow[];
  parsedConfig: FlowNodeConfig;
};

export type BuilderViewModel = {
  flow: FlowRow;
  nodes: FlowNodeWithButtons[];
  publishedFlowId: string | null;
};

export type ActivityPoint = {
  date: string;
  count: number;
};

export type InteractionPreview = {
  id: string;
  eventType: InteractionLogRow["event_type"];
  direction: InteractionLogRow["direction"];
  messageText: string | null;
  createdAt: string;
  botUserName: string | null;
};

export function parseNodeConfig(config: Json): FlowNodeConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  const record = config as Record<string, Json>;

  return {
    nextNodeId: typeof record.nextNodeId === "string" ? record.nextNodeId : null,
    successMessage:
      typeof record.successMessage === "string" ? record.successMessage : null,
    productName:
      typeof record.productName === "string" ? record.productName : null,
    url: typeof record.url === "string" ? record.url : null,
    buttonLabel:
      typeof record.buttonLabel === "string" ? record.buttonLabel : null,
  };
}
