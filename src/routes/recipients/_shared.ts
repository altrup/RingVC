export const panelPath = (scope: string) => `/recipients/${scope}`;

// "for <#id>" / "globally"
export const scopeSuffix = (scope: string) =>
	scope === "global" ? "globally" : `for <#${scope}>`;
