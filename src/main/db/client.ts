import { createClient } from "@supabase/supabase-js";

import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@config";

import { Database } from "./database.types";

// service role bypasses RLS; this client must never be exposed to end users
export const db = createClient<Database>(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{ auth: { persistSession: false } },
);

// unwraps a supabase-js response, throwing on error
export const throwOnError = <T>({
	data,
	error,
}: {
	data: T;
	error: { message: string } | null;
}): T => {
	if (error) throw new Error(`database error: ${error.message}`);
	return data;
};

// unwraps a row-returning supabase-js response, throwing on error.
// data is null only alongside an error, so rows are always present
export const rowsOf = <T>(response: {
	data: T[] | null;
	error: { message: string } | null;
}): T[] => {
	return throwOnError(response) ?? [];
};
