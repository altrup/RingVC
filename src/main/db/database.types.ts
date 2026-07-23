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
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
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
				Relationships: [
					{
						foreignKeyName: "voice_chat_users_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["user_id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			record_usage: { Args: { p_interaction: string }; Returns: undefined };
		};
		Enums: {
			discord_user_mode: "normal" | "stealth" | "auto";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
		keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
		keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
		keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
