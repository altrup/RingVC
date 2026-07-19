import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

export const pageJumpPost: Handler<"POST"> = (router, interaction, state) => {
	const query = state.queryParams;
	const to = query.get("to") ?? "/";
	const input = state.fields?.getTextInputValue("page")?.trim() ?? "";
	const parsed = /^\d+$/.test(input) ? Number(input) : NaN;
	const pageCount = parseInt(query.get("pageCount") ?? "1", 10) || 1;
	// a bad or out-of-range entry stays on the page the modal was opened from
	if (isNaN(parsed) || parsed < 1 || parsed > pageCount)
		return flashRedirect(to, `"${input}" is not a valid page number`, "warn", {
			page: query.get("page") ?? "0",
		});
	return { redirect: to, queryParams: { page: String(parsed - 1) } };
};
