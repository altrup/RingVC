import { submitFeedback } from "@db/feedback";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { PANEL } from "../_shared";

export const aboutFeedbackPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const content = (state.fields?.getTextInputValue("content") ?? "").trim();
	if (!content)
		return flashRedirect(
			interaction,
			PANEL,
			"Feedback was empty, nothing was sent",
			"warn",
		);

	await submitFeedback(content);
	return flashRedirect(
		interaction,
		PANEL,
		"Feedback sent. Thank you!",
		"success",
	);
};
