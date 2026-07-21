import { EmbedRouter } from "discord-embed-router";
import {
	APIActionRowComponent,
	APIButtonComponentWithCustomId,
	APIComponentInMessageActionRow,
	Client,
	EmbedBuilder,
	Interaction,
} from "discord.js";
import { expect, test } from "vitest";

import { registerRoutes } from "@routes/index";
import { RingRouter } from "@routes/types";

import { noticeGet } from "./get";

const makeRouter = (): RingRouter => {
	const router = new EmbedRouter(
		new Client({ intents: [] }),
	) as unknown as RingRouter;
	registerRoutes(router);
	return router;
};

const interaction = { user: { id: "caller" } } as unknown as Interaction;

const state = (query: Record<string, string>) =>
	({
		params: {},
		path: "/notice",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
		globals: { commandIds: new Map() },
	}) as unknown as Parameters<typeof noticeGet>[2];

const render = async (query: Record<string, string>) => {
	const result = await noticeGet(makeRouter(), interaction, state(query));
	if ("redirect" in result) throw new Error("expected a render");
	const embed = (result.embeds?.[0] as EmbedBuilder).toJSON();
	const row = result
		.components?.[0] as APIActionRowComponent<APIComponentInMessageActionRow>;
	const button = row.components[0] as APIButtonComponentWithCustomId;
	return { embed, button };
};

test("the notice shows the flash line and a button to the target panel", async () => {
	const { embed, button } = await render({
		flash: "Ringed <@1>",
		level: "success",
		to: "/ring",
	});
	expect(embed.description).toContain("Ringed <@1>");
	expect(embed.description).toContain("✅");
	// the flash is the whole message here, not a footnote on a panel, so it
	// renders unquoted
	expect(embed.description).not.toMatch(/^> /m);
	expect(button.label).toBe("Open Quick ring panel");
});

test("the notice names the panel for each command-reachable target", async () => {
	expect(
		(await render({ flash: "x", level: "warn", to: "/mode" })).button.label,
	).toBe("Open Mode panel");
	expect(
		(await render({ flash: "x", level: "warn", to: "/signups?page=2" })).button
			.label,
	).toBe("Open Signups panel");
	expect(
		(
			await render({
				flash: "x",
				level: "warn",
				to: "/signups/roles/by-role/1",
			})
		).button.label,
	).toBe("Open Role signups panel");
});

test("an unmapped target still gets a working generic button", async () => {
	const { button } = await render({ flash: "x", level: "warn", to: "/filter" });
	expect(button.label).toBe("Open panel");
});
