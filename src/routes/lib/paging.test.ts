import {
	diffSelection,
	PAGE_SIZE,
	paginate,
	withPageLabel,
} from "@routes/lib/paging";
import { expect, test } from "vitest";

const ids = (count: number, offset = 0) =>
	Array.from({ length: count }, (_, i) => `${i + offset + 1}`);

test("a partial page fits one page with no pagination", () => {
	expect(paginate(ids(PAGE_SIZE - 1), null)).toStrictEqual({
		pageItems: ids(PAGE_SIZE - 1),
		page: 0,
		pageCount: 1,
	});
});

test("an exactly full page adds no trailing page while the select has room", () => {
	expect(paginate(ids(PAGE_SIZE), null)).toStrictEqual({
		pageItems: ids(PAGE_SIZE),
		page: 0,
		pageCount: 1,
	});
});

test("lists over the page size split into pages of PAGE_SIZE", () => {
	const items = ids(PAGE_SIZE + 5);
	expect(paginate(items, "1")).toStrictEqual({
		pageItems: items.slice(PAGE_SIZE),
		page: 1,
		pageCount: 2,
	});
});

test("a list that is an exact multiple of the page size adds no trailing page", () => {
	const items = ids(PAGE_SIZE * 2);
	expect(paginate(items, "1")).toStrictEqual({
		pageItems: items.slice(PAGE_SIZE),
		page: 1,
		pageCount: 2,
	});
});

test("a stale page index clamps to the last page", () => {
	const items = ids(PAGE_SIZE + 5);
	expect(paginate(items, "7").page).toBe(1);
});

test("garbage and negative page indexes fall back to the first page", () => {
	expect(paginate(ids(PAGE_SIZE + 5), "abc").page).toBe(0);
	expect(paginate(ids(PAGE_SIZE + 5), "-3").page).toBe(0);
});

test("selecting new values adds them without touching other pages", () => {
	const allItems = ids(PAGE_SIZE + 5);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({ allItems, pageItems, submitted: [...pageItems, "999"] }),
	).toStrictEqual({ added: ["999"], removed: [], alreadyPresent: [] });
});

test("deselecting page entries removes only them", () => {
	const allItems = ids(PAGE_SIZE + 5);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({ allItems, pageItems, submitted: pageItems.slice(1) }),
	).toStrictEqual({ added: [], removed: [pageItems[0]], alreadyPresent: [] });
});

test("adds and removes apply together from one submission", () => {
	const allItems = ids(PAGE_SIZE + 5);
	const { pageItems } = paginate(allItems, "1");
	expect(
		diffSelection({
			allItems,
			pageItems,
			submitted: [...pageItems.slice(1), "999"],
		}),
	).toStrictEqual({
		added: ["999"],
		removed: [pageItems[0]],
		alreadyPresent: [],
	});
});

test("a submitted value that already lives on another page is not re-added", () => {
	const allItems = ids(PAGE_SIZE + 5);
	const { pageItems } = paginate(allItems, "1");
	// "1" is on page 0; selecting it on page 1 must not report an add
	expect(
		diffSelection({ allItems, pageItems, submitted: [...pageItems, "1"] }),
	).toStrictEqual({ added: [], removed: [], alreadyPresent: ["1"] });
});

test("deselecting everything on a page removes the whole page only", () => {
	const allItems = ids(PAGE_SIZE + 5);
	const { pageItems } = paginate(allItems, "0");
	expect(diffSelection({ allItems, pageItems, submitted: [] })).toStrictEqual({
		added: [],
		removed: pageItems,
		alreadyPresent: [],
	});
});

test("withPageLabel points at the page an existing entry lives on", () => {
	const allItems = ids(PAGE_SIZE * 2);
	const label = withPageLabel(allItems, (id) => `#${id}`, 2);
	expect(label("1")).toBe("#1 (page 1)");
	expect(label(`${PAGE_SIZE + 1}`)).toBe(`#${PAGE_SIZE + 1} (page 2)`);
});

test("withPageLabel leaves entries on the viewed page unlabeled", () => {
	const allItems = ids(PAGE_SIZE * 2);
	expect(withPageLabel(allItems, (id) => `#${id}`, 0)("1")).toBe("#1");
	expect(withPageLabel(allItems, (id) => `#${id}`, 1)(`${PAGE_SIZE + 1}`)).toBe(
		`#${PAGE_SIZE + 1}`,
	);
});
