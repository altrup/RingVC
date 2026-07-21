export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			auto_ring: {
				Row: {
					channel_id: string | null;
					enabled: boolean;
					user_id: string;
				};
				Insert: {
					channel_id?: string | null;
					enabled: boolean;
					user_id: string;
				};
				Update: {
					channel_id?: string | null;
					enabled?: boolean;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "auto_ring_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["user_id"];
					},
				];
			};
			default_ringees: {
				Row: {
					channel_id: string | null;
					ringee_user_id: string;
					user_id: string;
				};
				Insert: {
					channel_id?: string | null;
					ringee_user_id: string;
					user_id: string;
				};
				Update: {
					channel_id?: string | null;
					ringee_user_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "default_ringees_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["user_id"];
					},
				];
			};
			error_reports: {
				Row: {
					created_at: string;
					error: string;
					id: number;
					interaction: string;
				};
				Insert: {
					created_at?: string;
					error: string;
					id?: never;
					interaction: string;
				};
				Update: {
					created_at?: string;
					error?: string;
					id?: never;
					interaction?: string;
				};
				Relationships: [];
			};
			filter_entries: {
				Row: {
					channel_id: string | null;
					target_user_id: string;
					user_id: string;
				};
				Insert: {
					channel_id?: string | null;
					target_user_id: string;
					user_id: string;
				};
				Update: {
					channel_id?: string | null;
					target_user_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "filter_entries_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["user_id"];
					},
				];
			};
			filters: {
				Row: {
					channel_id: string | null;
					is_whitelist: boolean;
					user_id: string;
				};
				Insert: {
					channel_id?: string | null;
					is_whitelist: boolean;
					user_id: string;
				};
				Update: {
					channel_id?: string | null;
					is_whitelist?: boolean;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "filters_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["user_id"];
					},
				];
			};
			usage_counts: {
				Row: {
					count: number;
					day: string;
					interaction: string;
				};
				Insert: {
					count?: number;
					day?: string;
					interaction: string;
				};
				Update: {
					count?: number;
					day?: string;
					interaction?: string;
				};
				Relationships: [];
			};
			users: {
				Row: {
					mode: Database["public"]["Enums"]["discord_user_mode"];
					user_id: string;
				};
				Insert: {
					mode?: Database["public"]["Enums"]["discord_user_mode"];
					user_id: string;
				};
				Update: {
					mode?: Database["public"]["Enums"]["discord_user_mode"];
					user_id?: string;
				};
				Relationships: [];
			};
			voice_chat_roles: {
				Row: {
					channel_id: string;
					role_id: string;
				};
				Insert: {
					channel_id: string;
					role_id: string;
				};
				Update: {
					channel_id?: string;
					role_id?: string;
				};
				Relationships: [];
			};
			voice_chat_users: {
				Row: {
					channel_id: string;
					user_id: string;
				};
				Insert: {
					channel_id: string;
					user_id: string;
				};
				Update: {
					channel_id?: string;
					user_id?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			record_usage: {
				Args: {
					p_interaction: string;
				};
				Returns: undefined;
			};
		};
		Enums: {
			discord_user_mode: "normal" | "stealth" | "auto";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema["Tables"] | { schema: keyof Database },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema["Tables"] | { schema: keyof Database },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema["Enums"] | { schema: keyof Database },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			discord_user_mode: ["normal", "stealth", "auto"],
		},
	},
} as const;
