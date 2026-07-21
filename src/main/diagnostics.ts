import { RouteInfo } from "discord-embed-router";

import { recordError, recordUsage } from "@db/diagnostics";
import { RingRouter } from "@routes/types";

export const routeKey = (info: RouteInfo): string =>
	`${info.method} ${info.path}`;

// counts usage and records errors for embed interactions. Only
// "interaction"-triggered hops count: command dispatches are counted at the
// command entry point, and redirect hops are renders, not user actions
export const observeRouter = (router: RingRouter): void => {
	router.on("route", (_interaction, info) => {
		if (info.trigger === "interaction") recordUsage(routeKey(info));
	});
	router.onError((err, _interaction, info) => {
		recordError(info ? routeKey(info) : "ROUTER", err);
	});
};
