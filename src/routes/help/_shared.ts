import { subNav } from "@routes/lib/components";
import { RingRouter } from "@routes/types";

export const COLOR = "#6197cd";
export const HELP = "/help";
export const CATALOG = "/help/catalog";

export const helpSubNav = (router: RingRouter, active: "help" | "catalog") =>
	subNav(router, [
		{ label: "Getting started", path: HELP, active: active === "help" },
		{ label: "Catalog", path: CATALOG, active: active === "catalog" },
	]);
