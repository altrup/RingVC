import { db, throwOnError } from "./client";

export const submitFeedback = async (content: string): Promise<void> => {
	throwOnError(await db.from("feedback").insert({ content }));
};
