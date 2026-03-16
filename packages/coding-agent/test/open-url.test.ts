import { describe, expect, test, vi } from "vitest";
import { getOpenUrlCommand, openExternalUrl } from "../src/modes/interactive/components/open-url.js";

describe("getOpenUrlCommand", () => {
	test("returns macOS open command", () => {
		expect(getOpenUrlCommand("https://example.com", "darwin")).toEqual({
			command: "open",
			args: ["https://example.com"],
		});
	});

	test("returns Windows rundll32 command", () => {
		expect(getOpenUrlCommand("https://example.com", "win32")).toEqual({
			command: "rundll32",
			args: ["url.dll,FileProtocolHandler", "https://example.com"],
		});
	});

	test("returns xdg-open command for Linux", () => {
		expect(getOpenUrlCommand("https://example.com", "linux")).toEqual({
			command: "xdg-open",
			args: ["https://example.com"],
		});
	});
});

describe("openExternalUrl", () => {
	test("spawns detached process without shell parsing", () => {
		const child = {
			on: vi.fn().mockReturnThis(),
			unref: vi.fn(),
		};
		const spawnFn = vi.fn().mockReturnValue(child) as NonNullable<Parameters<typeof openExternalUrl>[2]>;

		openExternalUrl("https://example.com", "linux", spawnFn);

		expect(spawnFn).toHaveBeenCalledTimes(1);
		expect(spawnFn).toHaveBeenCalledWith("xdg-open", ["https://example.com"], {
			shell: false,
			detached: true,
			stdio: "ignore",
			windowsHide: true,
		});
		expect(child.on).toHaveBeenCalledWith("error", expect.any(Function));
		expect(child.unref).toHaveBeenCalledTimes(1);
	});

	test("keeps malicious payload as a single argument", () => {
		const child = {
			on: vi.fn().mockReturnThis(),
			unref: vi.fn(),
		};
		const spawnFn = vi.fn().mockReturnValue(child) as NonNullable<Parameters<typeof openExternalUrl>[2]>;
		const maliciousUrl = 'https://example.com/callback?next=";touch /tmp/pwned;echo "';

		openExternalUrl(maliciousUrl, "linux", spawnFn);

		expect(spawnFn).toHaveBeenCalledTimes(1);
		expect(spawnFn).toHaveBeenCalledWith("xdg-open", [maliciousUrl], expect.any(Object));
	});
});
