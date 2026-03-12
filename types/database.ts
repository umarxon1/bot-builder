export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string;
          email: string;
          full_name: string | null;
          default_workspace_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email: string;
          full_name?: string | null;
          default_workspace_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          email?: string;
          full_name?: string | null;
          default_workspace_id?: string | null;
          updated_at?: string;
        }
      >;
      workspaces: TableDefinition<
        {
          id: string;
          name: string;
          slug: string;
          owner_user_id: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          owner_user_id: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          slug?: string;
          owner_user_id?: string;
          updated_at?: string;
        }
      >;
      workspace_members: TableDefinition<
        {
          id: string;
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["member_role"];
          created_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          created_at?: string;
        },
        {
          workspace_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
        }
      >;
      bots: TableDefinition<
        {
          id: string;
          workspace_id: string;
          name: string;
          telegram_bot_id: string;
          telegram_username: string | null;
          telegram_first_name: string | null;
          status: Database["public"]["Enums"]["bot_status"];
          published_flow_id: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          name: string;
          telegram_bot_id: string;
          telegram_username?: string | null;
          telegram_first_name?: string | null;
          status?: Database["public"]["Enums"]["bot_status"];
          published_flow_id?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          telegram_bot_id?: string;
          telegram_username?: string | null;
          telegram_first_name?: string | null;
          status?: Database["public"]["Enums"]["bot_status"];
          published_flow_id?: string | null;
          verified_at?: string | null;
          updated_at?: string;
        }
      >;
      bot_connections: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          encrypted_token: string;
          token_last_four: string;
          webhook_secret_hash: string | null;
          webhook_url: string | null;
          status: Database["public"]["Enums"]["connection_status"];
          last_webhook_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          encrypted_token: string;
          token_last_four: string;
          webhook_secret_hash?: string | null;
          webhook_url?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
          last_webhook_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          encrypted_token?: string;
          token_last_four?: string;
          webhook_secret_hash?: string | null;
          webhook_url?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
          last_webhook_at?: string | null;
          last_error?: string | null;
          updated_at?: string;
        }
      >;
      bot_flows: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          name: string;
          version: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          name: string;
          version?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          version?: number;
          is_published?: boolean;
          published_at?: string | null;
          updated_at?: string;
        }
      >;
      flow_nodes: TableDefinition<
        {
          id: string;
          workspace_id: string;
          flow_id: string;
          key: string;
          title: string;
          type: Database["public"]["Enums"]["flow_node_type"];
          content: string;
          config: Json;
          is_start: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          flow_id: string;
          key: string;
          title: string;
          type: Database["public"]["Enums"]["flow_node_type"];
          content: string;
          config?: Json;
          is_start?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          key?: string;
          title?: string;
          type?: Database["public"]["Enums"]["flow_node_type"];
          content?: string;
          config?: Json;
          is_start?: boolean;
          order_index?: number;
          updated_at?: string;
        }
      >;
      flow_buttons: TableDefinition<
        {
          id: string;
          workspace_id: string;
          node_id: string;
          label: string;
          kind: Database["public"]["Enums"]["flow_button_kind"];
          target_node_id: string | null;
          url: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          node_id: string;
          label: string;
          kind?: Database["public"]["Enums"]["flow_button_kind"];
          target_node_id?: string | null;
          url?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          label?: string;
          kind?: Database["public"]["Enums"]["flow_button_kind"];
          target_node_id?: string | null;
          url?: string | null;
          order_index?: number;
          updated_at?: string;
        }
      >;
      bot_users: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          telegram_user_id: string;
          chat_id: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          current_node_id: string | null;
          session_state: Json | null;
          started_at: string;
          last_interacted_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          telegram_user_id: string;
          chat_id: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          current_node_id?: string | null;
          session_state?: Json | null;
          started_at?: string;
          last_interacted_at?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          current_node_id?: string | null;
          session_state?: Json | null;
          last_interacted_at?: string;
          updated_at?: string;
        }
      >;
      leads: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id: string | null;
          flow_node_id: string | null;
          full_name: string;
          phone: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id?: string | null;
          flow_node_id?: string | null;
          full_name: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          full_name?: string;
          phone?: string;
          updated_at?: string;
        }
      >;
      orders: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id: string | null;
          flow_node_id: string | null;
          product_name: string;
          customer_name: string;
          phone: string;
          note: string | null;
          status: Database["public"]["Enums"]["order_status"];
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id?: string | null;
          flow_node_id?: string | null;
          product_name: string;
          customer_name: string;
          phone: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          created_at?: string;
          updated_at?: string;
        },
        {
          product_name?: string;
          customer_name?: string;
          phone?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
        }
      >;
      broadcasts: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          created_by_user_id: string;
          title: string;
          message: string;
          preview_recipient_count: number;
          sent_count: number;
          failed_count: number;
          status: Database["public"]["Enums"]["broadcast_status"];
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          created_by_user_id: string;
          title: string;
          message: string;
          preview_recipient_count?: number;
          sent_count?: number;
          failed_count?: number;
          status?: Database["public"]["Enums"]["broadcast_status"];
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          title?: string;
          message?: string;
          preview_recipient_count?: number;
          sent_count?: number;
          failed_count?: number;
          status?: Database["public"]["Enums"]["broadcast_status"];
          sent_at?: string | null;
          updated_at?: string;
        }
      >;
      broadcast_deliveries: TableDefinition<
        {
          id: string;
          workspace_id: string;
          broadcast_id: string;
          bot_user_id: string;
          telegram_chat_id: string;
          status: Database["public"]["Enums"]["delivery_status"];
          error_message: string | null;
          attempted_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          broadcast_id: string;
          bot_user_id: string;
          telegram_chat_id: string;
          status?: Database["public"]["Enums"]["delivery_status"];
          error_message?: string | null;
          attempted_at?: string | null;
          created_at?: string;
        },
        {
          status?: Database["public"]["Enums"]["delivery_status"];
          error_message?: string | null;
          attempted_at?: string | null;
        }
      >;
      interaction_logs: TableDefinition<
        {
          id: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id: string | null;
          flow_node_id: string | null;
          direction: Database["public"]["Enums"]["interaction_direction"];
          event_type: Database["public"]["Enums"]["interaction_event_type"];
          message_text: string | null;
          metadata: Json | null;
          created_at: string;
        },
        {
          id?: string;
          workspace_id: string;
          bot_id: string;
          bot_user_id?: string | null;
          flow_node_id?: string | null;
          direction: Database["public"]["Enums"]["interaction_direction"];
          event_type: Database["public"]["Enums"]["interaction_event_type"];
          message_text?: string | null;
          metadata?: Json | null;
          created_at?: string;
        },
        {
          message_text?: string | null;
          metadata?: Json | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      member_role: "owner" | "member";
      bot_status: "draft" | "connected" | "webhook_live" | "paused";
      connection_status: "pending" | "verified" | "webhook_live" | "error";
      flow_node_type:
        | "message"
        | "menu"
        | "lead_capture"
        | "order_form"
        | "external_link";
      flow_button_kind: "navigate" | "url";
      order_status: "new" | "contacted" | "completed" | "cancelled";
      broadcast_status: "draft" | "previewed" | "sending" | "sent" | "failed";
      delivery_status: "pending" | "sent" | "failed";
      interaction_direction: "incoming" | "outgoing" | "system";
      interaction_event_type:
        | "start"
        | "message"
        | "callback"
        | "lead_captured"
        | "order_captured"
        | "broadcast"
        | "error"
        | "flow_publish";
    };
    CompositeTypes: Record<string, never>;
  };
};
