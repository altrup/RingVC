import { diffSelection, paginate } from "@routes/lib/paging";
import { expect, test } from "vitest";

const ids = (count: number, offset = 0) =>
	Array.from({ length: count }, (_, i) => `${i + offset + 1}`);

test("lists of 25 or fewer fit one page with no pagination", () => {
	expect(paginate(ids(25), null)).toStrictEqual({
		pageItems: ids(25),
		page: 0,
		pageCount: 1,
	});
});

test("lists over 25 split into pages of 25", () => {
	const items = ids(30);
	expect(paginate(items, "1")).toStrictEqual({
		pageItems: items.slice(25),
		page: 1,
		pageCount: 2,
	});
});

test("a full last page is followed by an empty page for adding", () => {
	const items = ids(50);
	expect(paginate(items, "2")).toStrictEqual({
		pageItems: [],
		page: 2,
		pageCount: 3,
	});
});

test("a stale page index clamps to the last page", () => {
	const items = ids(30);
	expect(paginate(items, "7").page).toBe(1);
});

test("garbage and negative page indexes fall back to the first page", () => {
	expect(paginate(ids(30), "abc").page).toBe(0);
	expect(paginate(ids(30), "-3").page).toBe(0);
});

test("selecting new values adds them without touching other pages", () => {
	const allItems = ids(30);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({ allItems, pageItems, submitted: [...pageItems, "999"] }),
	).toStrictEqual({ added: ["999"], removed: [] });
});

test("deselecting page entries removes only them", () => {
	const allItems = ids(30);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({ allItems, pageItems, submitted: pageItems.slice(1) }),
	).toStrictEqual({ added: [], removed: [pageItems[0]] });
});

test("adds and removes apply together from one submission", () => {
	const allItems = ids(30);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({
			allItems,
			pageItems,
			submitted: [...pageItems.slice(1), "999"],
		}),
	).toStrictEqual({ added: ["999"], removed: [pageItems[0]] });
});

test("a submitted value that already lives on another page is not re-added", () => {
	const allItems = ids(30);
	const { pageItems } = paginate(allItems, "1");
	// "1" is on page 0; selecting it on page 1 must not report an add
	expect(
		diffSelection({ allItems, pageItems, submitted: [...pageItems, "1"] }),
	).toStrictEqual({ added: [], removed: [] });
});

test("deselecting everything on a page removes the whole page only", () => {
	const allItems = ids(30);
	const { pageItems } = paginate(allItems, "0");
	expect(diffSelection({ allItems, pageItems, submitted: [] })).toStrictEqual({
		added: [],
		removed: pageItems,
	});
});
