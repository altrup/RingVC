import { RingRouter } from "@routes/types";

import { commandsGet } from "./commands/get";
import { deleteDataConfirmModal } from "./delete-data/confirm/modal";
import { deleteDataGet } from "./delete-data/get";
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
import { recipientsClearModal } from "./recipients/[scope]/clear/modal";
import { recipientsClearPost } from "./recipients/[scope]/clear/post";
import { recipientsGet } from "./recipients/[scope]/get";
import { recipientsMembersPost } from "./recipients/[scope]/members/post";
import { ringDefaultPost } from "./ring/default/post";
import { ringGet } from "./ring/get";
import { ringUserPost } from "./ring/user/post";
import { ringUsersPost } from "./ring/users/post";
import { signupsGet } from "./signups/get";
import { signupsMembersPost } from "./signups/members/post";
import { signupsRoleGet } from "./signups/roles/[roleId]/get";
import { signupsRolePost } from "./signups/roles/[roleId]/post";
import { signupsRolesGet } from "./signups/roles/get";
import { signupsRolesRemovePost } from "./signups/roles/remove/post";

// handlers live in files mirroring their route: the folder is the path (with
// [param] segments) and the file is the method
export const registerRoutes = (router: RingRouter) => {
	router.route("/", { get: homeGet });
	router.route("/commands", { get: commandsGet });

	// scoped panels answer their bare path as the global scope, so their
	// scope-switch channel select can target "{/:channelId}" and fall back to
	// global when the selection is cleared
	router.route(["/filter", "/filter/:scope"], { get: filterGet });
	router.route("/filter/:scope/members", { post: filterMembersPost });
	router.route("/filter/:scope/type", { post: filterTypePost });
	router.route("/filter/:scope/reset", {
		modal: filterResetModal,
		post: filterResetPost,
	});

	router.route(["/recipients", "/recipients/:scope"], { get: recipientsGet });
	router.route("/recipients/:scope/members", { post: recipientsMembersPost });
	router.route("/recipients/:scope/clear", {
		modal: recipientsClearModal,
		post: recipientsClearPost,
	});
	router.route("/recipients/:scope/auto-ring", {
		post: recipientsAutoRingPost,
	});
	router.route("/recipients/:scope/auto-ring/unset", {
		post: recipientsAutoRingUnsetPost,
	});

	router.route("/mode", { get: modeGet, post: modePost });

	router.route("/signups", { get: signupsGet });
	router.route("/signups/members", { post: signupsMembersPost });
	router.route("/signups/roles", { get: signupsRolesGet });
	router.route("/signups/roles/remove", { post: signupsRolesRemovePost });
	// registered after /signups/roles/remove so "remove" never binds :roleId
	router.route("/signups/roles/:roleId", {
		get: signupsRoleGet,
		post: signupsRolePost,
	});

	router.route("/ring", { get: ringGet });
	router.route("/ring/users", { post: ringUsersPost });
	router.route("/ring/user", { post: ringUserPost });
	router.route("/ring/default", { post: ringDefaultPost });

	router.route("/delete-data", { get: deleteDataGet, post: deleteDataPost });
	router.route("/delete-data/confirm", { modal: deleteDataConfirmModal });
};
