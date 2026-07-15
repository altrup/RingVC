// Discord's cap on select menu options and default values
export const PAGE_SIZE = 10;

export type Page = {
	pageItems: string[];
	page: number;
	pageCount: number;
};

// slices one select-menu page out of a list. The last page is always
// partial (a length that is an exact multiple of PAGE_SIZE gets a trailing
// empty page), so adding stays possible even when every existing page is
// full; stale page indexes clamp to the last page
export const paginate = (items: string[], rawPage: string | null): Page => {
	const pageCount = Math.floor(items.length / PAGE_SIZE) + 1;
	const parsed = parseInt(rawPage ?? "0");
	const page = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), pageCount - 1);
	return {
		pageItems: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
		page,
		pageCount,
	};
};

// diffs a select submission against the visible page: entries missing from
// the submission are removals, submitted values not in the whole list are
// additions (checking the whole list keeps pages independent: re-selecting
// a value that lives on another page is not an add)
export const diffSelection = ({
	allItems,
	pageItems,
	submitted,
}: {
	allItems: string[];
	pageItems: string[];
	submitted: string[];
}): { added: string[]; removed: string[] } => {
	const allSet = new Set(allItems);
	const submittedSet = new Set(submitted);
	return {
		added: submitted.filter((value) => !allSet.has(value)),
		removed: pageItems.filter((value) => !submittedSet.has(value)),
	};
};

// resolves an add/remove edit for a paged member select from either input a
// handler can receive: a select submission (diffed against the visible page)
// or `add`/`remove` query params from a command adapter. Callers still filter
// the result against their current set before mutating
export const resolveSelectionEdit = ({
	current,
	values,
	queryParams,
}: {
	current: string[];
	values: string[] | undefined;
	queryParams: URLSearchParams;
}): { addsRequested: string[]; removesRequested: string[] } => {
	if (values) {
		const { pageItems } = paginate(current, queryParams.get("page"));
		const { added, removed } = diffSelection({
			allItems: current,
			pageItems,
			submitted: values,
		});
		return { addsRequested: added, removesRequested: removed };
	}
	return {
		addsRequested: queryParams.getAll("add"),
		removesRequested: queryParams.getAll("remove"),
	};
};
