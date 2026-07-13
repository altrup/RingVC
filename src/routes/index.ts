import { RingRouter } from "@routes/types";

import { commandsGet } from "./commands/get";
import { deleteDataGet } from "./delete-data/get";
import { deleteDataModal } from "./delete-data/modal";
import { deleteDataPost } from "./delete-data/post";
import { filterGet } from "./filter/[scope]/get";
import { filterMembersPost } from "./filter/[scope]/members/post";
import { filterResetModal } from "./filter/[scope]/reset/modal";
import { filterResetPost } from "./filter/[scope]/reset/post";
import { filterTypePost } from "./filter/[scope]/type/post";
import { homeGet } from "./get";
import { modeGet } from "./mode/get";
import { modePost } from "./mode/post";
import { recipientsAutoRingPost } from "./recipients/[scope]/auto-ring/post";
import { recipientsAutoRingUnsetPost } from "./recipients/[scope]/auto-ring/unset/post";
import { recipientsGet } from "./recipients/[scope]/get";
import { recipientsMembersPost } from "./recipients/[scope]/members/post";
import { recipientsResetModal } from "./recipients/[scope]/reset/modal";
import { recipientsResetPost } from "./recipients/[scope]/reset/post";
import { ringDefaultPost } from "./ring/default/post";
import { ringGet } from "./ring/get";
import { ringUserPost } from "./ring/user/post";
import { ringUsersPost } from "./ring/users/post";
import { signupsGet } from "./signups/get";
import { signupsMembersPost } from "./signups/members/post";
import { rolesByChannelGet } from "./signups/roles/by-channel/get";
import { rolesByChannelEditPost } from "./signups/roles/by-channel/roles/post";
import { rolesByRoleEditPost } from "./signups/roles/by-role/channels/post";
import { rolesByRoleGet } from "./signups/roles/by-role/get";

// handlers live in files mirroring their route: the folder is the path (with
// [param] segments) and the file is the method
export const registerRoutes = (router: RingRouter) => {
	router.get("/", homeGet);
	router.get("/commands", commandsGet);

	// scoped panels answer their bare path as the global scope, so their
	// scope-switch channel select can target "{/:channelId}" and fall back to
	// global when the selection is cleared
	router.get(["/filter", "/filter/:scope"], filterGet);
	router.post("/filter/:scope/members", filterMembersPost);
	router.post("/filter/:scope/type", filterTypePost);
	router.route("/filter/:scope/reset", {
		modal: filterResetModal,
		post: filterResetPost,
	});

	router.get(["/recipients", "/recipients/:scope"], recipientsGet);
	router.post("/recipients/:scope/members", recipientsMembersPost);
	router.route("/recipients/:scope/reset", {
		modal: recipientsResetModal,
		post: recipientsResetPost,
	});
	router.post("/recipients/:scope/auto-ring", recipientsAutoRingPost);
	router.post(
		"/recipients/:scope/auto-ring/unset",
		recipientsAutoRingUnsetPost,
	);

	router.route("/mode", { get: modeGet, post: modePost });

	router.get("/signups", signupsGet);
	router.post("/signups/members", signupsMembersPost);

	// role signups are a scoped panel like filter: an orientation segment
	// (by-channel / by-role) then the scope id. The bare path lands on the
	// by-channel view with nothing picked yet
	router.get(
		[
			"/signups/roles",
			"/signups/roles/by-channel",
			"/signups/roles/by-channel/:scope",
		],
		rolesByChannelGet,
	);
	router.post("/signups/roles/by-channel/:scope/roles", rolesByChannelEditPost);
	router.get(
		["/signups/roles/by-role", "/signups/roles/by-role/:scope"],
		rolesByRoleGet,
	);
	router.post("/signups/roles/by-role/:scope/channels", rolesByRoleEditPost);

	router.get("/ring", ringGet);
	router.post("/ring/users", ringUsersPost);
	router.post("/ring/user", ringUserPost);
	router.post("/ring/default", ringDefaultPost);

	router.route("/delete-data", {
		get: deleteDataGet,
		post: deleteDataPost,
		modal: deleteDataModal,
	});
};
