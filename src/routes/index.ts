import { deleteDataHandlers } from "@routes/deleteData";
import { filterHandlers } from "@routes/filter";
import { homeHandlers } from "@routes/home";
import { modeHandlers } from "@routes/mode";
import { recipientsHandlers } from "@routes/recipients";
import { ringHandlers } from "@routes/ring";
import { signupsHandlers } from "@routes/signups";
import { RingRouter } from "@routes/types";

export const registerRoutes = (router: RingRouter) => {
	router.route("/", homeHandlers.panel);
	router.route("/commands", homeHandlers.commands);

	// scoped panels answer their bare path as the global scope, so their
	// scope-switch channel select can target "{/:channelId}" and fall back to
	// global when the selection is cleared
	router.route(["/filter", "/filter/:scope"], filterHandlers.panel);
	router.route("/filter/:scope/members", filterHandlers.members);
	router.route("/filter/:scope/type", filterHandlers.type);
	router.route("/filter/:scope/reset", filterHandlers.reset);

	router.route(["/recipients", "/recipients/:scope"], recipientsHandlers.panel);
	router.route("/recipients/:scope/members", recipientsHandlers.members);
	router.route("/recipients/:scope/clear", recipientsHandlers.clear);
	router.route("/recipients/:scope/auto-ring", recipientsHandlers.autoRing);
	router.route(
		"/recipients/:scope/auto-ring/unset",
		recipientsHandlers.autoRingUnset,
	);

	router.route("/mode", modeHandlers.panel);

	router.route("/signups", signupsHandlers.panel);
	router.route("/signups/members", signupsHandlers.members);
	router.route("/signups/roles", signupsHandlers.roles);
	router.route("/signups/roles/remove", signupsHandlers.rolesRemove);
	// registered after /signups/roles/remove so "remove" never binds :roleId
	router.route("/signups/roles/:roleId", signupsHandlers.rolePage);

	router.route("/ring", ringHandlers.panel);
	router.route("/ring/users", ringHandlers.users);
	router.route("/ring/user", ringHandlers.user);
	router.route("/ring/default", ringHandlers.default);

	router.route("/delete-data", deleteDataHandlers.panel);
	router.route("/delete-data/confirm", deleteDataHandlers.confirm);
};
