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

type Session =
	RingRouter extends EmbedRouter<Globals, infer S, infer _L> ? S : never;
type Locals =
	RingRouter extends EmbedRouter<Globals, infer _S, infer L> ? L : never;

export type Handler<M extends Method> = RouteHandler<
	M,
	Globals,
	Session,
	Locals
>;
export type Handlers = RouteHandlers<Globals, Session, Locals>;

// nameable alias for helper return types (declaration emit can't name the
// library's internal Unused symbol that Session/Locals infer to)
export type RingButton = RouteButtonBuilder<Globals, Session, Locals>;
