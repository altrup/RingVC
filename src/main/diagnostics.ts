import { Interaction } from "discord.js";

import { recordError, recordUsage } from "@db/diagnostics";
import { RingRouter } from "@routes/types";

// commands dispatch into routes and POSTs redirect into GETs, so one Discord
// interaction reaches several handlers; only its first key is counted
const countedInteractions = new WeakSet<Interaction>();

export const recordInteractionUsage = (
	key: string,
	interaction: Interaction,
): void => {
	if (countedInteractions.has(interaction)) return;
	countedInteractions.add(interaction);
	recordUsage(key);
};

// an error rethrown through nested wrapped handlers is reported only where
// it was first caught (the innermost, most specific key)
const reportedErrors = new WeakSet<object>();

export const recordErrorOnce = (key: string, error: unknown): void => {
	if (typeof error === "object" && error !== null) {
		if (reportedErrors.has(error)) return;
		reportedErrors.add(error);
	}
	recordError(key, error);
};

type AnyHandler = (...args: unknown[]) => unknown;

const keyOf = (method: string, path: unknown): string =>
	`${method.toUpperCase()} ${String(Array.isArray(path) ? path[0] : path)}`;

const wrap = (key: string, handler: AnyHandler): AnyHandler => {
	return (...args) => {
		recordInteractionUsage(key, args[1] as Interaction);
		try {
			const result = handler(...args);
			if (result instanceof Promise) {
				return result.catch((error: unknown) => {
					recordErrorOnce(key, error);
					throw error;
				});
			}
			return result;
		} catch (error) {
			recordErrorOnce(key, error);
			throw error;
		}
	};
};

const methods = ["get", "post", "put", "patch", "delete", "modal"] as const;

// wraps every subsequently registered route handler to record usage and
// errors; call before registerRoutes
export const instrumentRouter = (router: RingRouter): void => {
	type Registrar = (path: unknown, handler: AnyHandler) => void;
	for (const method of methods) {
		const original = router[method].bind(router) as Registrar;
		(router[method] as Registrar) = (path, handler) =>
			original(path, wrap(keyOf(method, path), handler));
	}

	type RouteRegistrar = (
		path: unknown,
		handlers: Record<string, AnyHandler>,
	) => void;
	const originalRoute = router.route.bind(router) as RouteRegistrar;
	(router.route as RouteRegistrar) = (path, handlers) =>
		originalRoute(
			path,
			Object.fromEntries(
				Object.entries(handlers).map(([method, handler]) => [
					method,
					wrap(keyOf(method, path), handler),
				]),
			),
		);
};
