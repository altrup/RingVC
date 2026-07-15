import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

export const pageJumpPost: Handler<"POST"> = (router, interaction, state) => {
	const query = state.queryParams;
	const to = query.get("to") ?? "/";
	const input = state.fields?.getTextInputValue("page") ?? "";
	const parsed = parseInt(input, 10);
	// a bad entry stays on the page the modal was opened from; an oversized
	// number needs no check because paginate clamps to the last page
	if (isNaN(parsed) || parsed < 1)
		return flashRedirect(to, `"${input}" is not a page number`, "warn", {
			page: query.get("page") ?? "0",
		});
	return { redirect: to, queryParams: { page: String(parsed - 1) } };
};
