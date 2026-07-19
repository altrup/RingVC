// how many entries a paged panel shows at once; a deliberate readability
// choice well under SELECT_MAX_VALUES
export const PAGE_SIZE = 10;
// Discord's cap on select menu max_values; edit selects allow it in full so
// users can add more entries per submit than one page displays.
export const SELECT_MAX_VALUES = 25;

export type Page = {
	pageItems: string[];
	page: number;
	pageCount: number;
};

// the "**Label** · 23 across 3 pages" summary line, counting only pages that
// hold entries so pageCountOf's trailing add page never inflates the count
export const pagedCountLine = (label: string, total: number): string => {
	const contentPages = Math.ceil(total / PAGE_SIZE);
	return `**${label}** · ${total > 0 ? total : "None"}${contentPages > 1 ? ` across ${contentPages} pages` : ""}`;
};

// setPattern options for a paged edit select's POST. The per-render key gives
// every render a fresh customId: Discord keeps a select's in-flight selection
// when a message edit leaves the component unchanged, so a fresh id resets it
export const pagedEditPattern = (
	page: number,
	timestamp: number,
): { method: "POST"; queryParams: Record<string, string>; key: string } => ({
	method: "POST",
	queryParams: { page: String(page) },
	// base36 for compactness; the key only needs to differ between renders
	key: timestamp.toString(36),
});

// how many pages a list spans. A full last page gets a trailing empty page
// only when a page fills the whole edit select (PAGE_SIZE >= SELECT_MAX_VALUES);
// otherwise the last page still has room to add entries. Empty list: one page
export const pageCountOf = (total: number): number => {
	const fullPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const needsAddPage =
		PAGE_SIZE >= SELECT_MAX_VALUES && total > 0 && total % PAGE_SIZE === 0;
	return fullPages + (needsAddPage ? 1 : 0);
};

// slices one select-menu page out of a list; stale page indexes clamp to
// the last page
export const paginate = (items: string[], rawPage: string | null): Page => {
	const pageCount = pageCountOf(items.length);
	const parsed = parseInt(rawPage ?? "0");
	const page = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), pageCount - 1);
	return {
		pageItems: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
		page,
		pageCount,
	};
};

// diffs a select submission against the visible page: values missing from the
// submission are removals, values not in the whole list are additions. Values
// on another page are no-ops, reported as `alreadyPresent` so the flash can
// point at the existing entry instead of claiming "no changes"
export const diffSelection = ({
	allItems,
	pageItems,
	submitted,
}: {
	allItems: string[];
	pageItems: string[];
	submitted: string[];
}): { added: string[]; removed: string[]; alreadyPresent: string[] } => {
	const allSet = new Set(allItems);
	const pageSet = new Set(pageItems);
	const submittedSet = new Set(submitted);
	return {
		added: submitted.filter((value) => !allSet.has(value)),
		removed: pageItems.filter((value) => !submittedSet.has(value)),
		alreadyPresent: submitted.filter(
			(value) => allSet.has(value) && !pageSet.has(value),
		),
	};
};

// labels a value with the page that displays it, e.g. "#general (page 2)", so a
// flash points at where an entry lives; skipped on the page already in view
export const withPageLabel =
	(allItems: string[], mention: (id: string) => string, viewedPage: number) =>
	(value: string): string => {
		const page = Math.floor(allItems.indexOf(value) / PAGE_SIZE);
		return page === viewedPage
			? mention(value)
			: `${mention(value)} (page ${page + 1})`;
	};

// resolves an add/remove edit from either input a handler gets: a select
// submission (diffed against the page) or `add`/`remove` query params from a
// command adapter. Callers still filter against their current set before mutating
export const resolveSelectionEdit = ({
	current,
	values,
	queryParams,
}: {
	current: string[];
	values: string[] | undefined;
	queryParams: URLSearchParams;
}): {
	addsRequested: string[];
	removesRequested: string[];
	alreadyPresent: string[];
} => {
	if (values) {
		const { pageItems } = paginate(current, queryParams.get("page"));
		const { added, removed, alreadyPresent } = diffSelection({
			allItems: current,
			pageItems,
			submitted: values,
		});
		return {
			addsRequested: added,
			removesRequested: removed,
			alreadyPresent,
		};
	}
	return {
		addsRequested: queryParams.getAll("add"),
		removesRequested: queryParams.getAll("remove"),
		alreadyPresent: [],
	};
};
