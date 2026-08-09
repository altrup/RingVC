import { defaultRingeesCommand } from "@commands/defaultRingees";

// the pre-rename name of /default_ringees: still registered so existing muscle
// memory works, but left out of /catalog and /help. Delete this file, its entry
// in commands.ts, and its name in commandNames.ts once it has been retired
export const defaultRingRecipients = defaultRingeesCommand(
	"default_ring_recipients",
);
