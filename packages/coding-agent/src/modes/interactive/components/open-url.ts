import { spawn } from "node:child_process";

export interface OpenUrlCommand {
	command: string;
	args: string[];
}

type Platform = NodeJS.Platform;
type SpawnFn = typeof spawn;

export function getOpenUrlCommand(url: string, platform: Platform = process.platform): OpenUrlCommand {
	if (platform === "darwin") {
		return { command: "open", args: [url] };
	}

	if (platform === "win32") {
		// Use rundll32 directly to avoid shell parsing on Windows.
		return { command: "rundll32", args: ["url.dll,FileProtocolHandler", url] };
	}

	return { command: "xdg-open", args: [url] };
}

export function openExternalUrl(url: string, platform: Platform = process.platform, spawnFn: SpawnFn = spawn): void {
	const { command, args } = getOpenUrlCommand(url, platform);

	const child = spawnFn(command, args, {
		shell: false,
		detached: true,
		stdio: "ignore",
		windowsHide: true,
	});

	// Best-effort browser launch: surface URL in UI regardless of opener availability.
	child.on("error", () => {});
	child.unref();
}
