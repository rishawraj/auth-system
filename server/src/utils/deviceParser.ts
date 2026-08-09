import { UAParser } from "ua-parser-js";

export interface ParsedDevice {
  browser: string;
  os: string;
  device: string;
}

export function parseDevice(userAgentString?: string | null): ParsedDevice {
  if (!userAgentString) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    };
  }

  try {
    const parser = new UAParser(userAgentString);
    const result = parser.getResult();

    const browserName = result.browser.name || "Unknown Browser";
    const browserVer = result.browser.version
      ? ` ${result.browser.version.split(".")[0]}`
      : "";
    const browser = `${browserName}${browserVer}`;

    const osName = result.os.name || "Unknown OS";
    const osVer = result.os.version ? ` ${result.os.version}` : "";
    const os = `${osName}${osVer}`;

    let deviceType: string | undefined = result.device.type;
    if (!deviceType) {
      deviceType = "desktop";
    }

    const deviceVendor = result.device.vendor ? `${result.device.vendor} ` : "";
    const deviceModel = result.device.model ? `${result.device.model}` : "";
    const deviceName = `${deviceVendor}${deviceModel}`.trim();

    const device =
      deviceName || deviceType.charAt(0).toUpperCase() + deviceType.slice(1);

    return { browser, os, device };
  } catch {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    };
  }
}
