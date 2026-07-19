import { RingRouter } from "@routes/types";

import { aboutGet } from "./about/get";
import { deleteDataGet } from "./delete-data/get";
import { deleteDataModal } from "./delete-data/modal";
import { deleteDataPost } from "./delete-data/post";
import { filterGet } from "./filter/[scope]/get";
import { filterMembersPost } from "./filter/[scope]/members/post";
import { filterResetModal } from "./filter/[scope]/reset/modal";
import { filterResetPost } from "./filter/[scope]/reset/post";
import { filterTypePost } from "./filter/[scope]/type/post";
import { homeGet } from "./get";
import { catalogGet } from "./help/catalog/get";
import { helpGet } from "./help/get";
import { modeGet } from "./mode/get";
import { modePost } from "./mode/post";
import { pageJumpModal } from "./page-jump/modal";
import { pageJumpPost } from "./page-jump/post";
import { recipientsAutoRingPost } from "./recipients/[scope]/auto-ring/post";
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
import { signupsResetModal } from "./signups/reset/modal";
import { signupsResetPost } from "./signups/reset/post";
import { rolesByChannelGet } from "./signups/roles/by-channel/get";
import { rolesByChannelResetModal } from "./signups/roles/by-channel/reset/modal";
import { rolesByChannelResetPost } from "./signups/roles/by-channel/reset/post";
import { rolesByChannelEditPost } from "./signups/roles/by-channel/roles/post";
import { rolesByRoleEditPost } from "./signups/roles/by-role/channels/post";
import { rolesByRoleGet } from "./signups/roles/by-role/get";
import { rolesByRoleResetModal } from "./signups/roles/by-role/reset/modal";
import { rolesByRoleResetPost } from "./signups/roles/by-role/reset/post";
import { rolesGet } from "./signups/roles/get";

// handlers live in files mirroring their route: the folder is the path (with
// [param] segments) and the file is the method
export const registerRoutes = (router: RingRouter) => {
	router.get("/", homeGet);
	router.get("/help", helpGet);
	router.get("/help/catalog", catalogGet);
	router.get("/about", aboutGet);

	// scoped panels answer their bare path as the global scope, so the scope-switch
	// select can target "{/:channelId}" and fall back to global when cleared
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

	router.route("/mode", { get: modeGet, post: modePost });

	// the shared page-jump modal every paginated panel's middle button opens;
	// the originating panel rides along in the `to` query param
	router.route("/page-jump", { modal: pageJumpModal, post: pageJumpPost });

	router.get("/signups", signupsGet);
	router.post("/signups/members", signupsMembersPost);
	router.route("/signups/reset", {
		modal: signupsResetModal,
		post: signupsResetPost,
	});

	// role signups open on a neutral view with a channel select and a role select;
	// picking either sets the orientation. Clearing a scope returns to the neutral path
	router.get(
		["/signups/roles", "/signups/roles/by-channel", "/signups/roles/by-role"],
		rolesGet,
	);
	router.get("/signups/roles/by-channel/:scope", rolesByChannelGet);
	router.post("/signups/roles/by-channel/:scope/roles", rolesByChannelEditPost);
	router.route("/signups/roles/by-channel/:scope/reset", {
		modal: rolesByChannelResetModal,
		post: rolesByChannelResetPost,
	});
	router.get("/signups/roles/by-role/:scope", rolesByRoleGet);
	router.post("/signups/roles/by-role/:scope/channels", rolesByRoleEditPost);
	router.route("/signups/roles/by-role/:scope/reset", {
		modal: rolesByRoleResetModal,
		post: rolesByRoleResetPost,
	});

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
