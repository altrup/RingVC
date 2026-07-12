import {
	EmbedRouter,
	Method,
	RouteButtonBuilder,
	RouteHandler,
	RouteHandlers,
} from "discord-embed-router";

import { CommandName } from "@commands/commandNames";

export type Globals = {
	commandIds: Map<CommandName, string>;
};

// sessions and locals are deliberately unused: panel state lives entirely in
// paths and query params, and route handlers import their db access directly
export type RingRouter = EmbedRouter<Globals>;

export type Handler<M extends Method> =
	RingRouter extends EmbedRouter<Globals, infer S, infer L>
		? RouteHandler<M, Globals, S, L>
		: never;
export type Handlers =
	RingRouter extends EmbedRouter<Globals, infer S, infer L>
		? RouteHandlers<Globals, S, L>
		: never;

// nameable alias for helper return types (declaration emit can't name the
// library's internal Unused symbol that Session/Locals default to)
export type RingButton =
	RingRouter extends EmbedRouter<Globals, infer S, infer L>
		? RouteButtonBuilder<Globals, S, L>
		: never;
