export type ToolAtriumConfig = { appBaseUrl: string };

function parseBaseUrl(value: string | undefined) {
  const candidate = (value || "https://toolatrium.com")
    .trim()
    .replace(/\/+$/, "");
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("ToolAtrium base URL must use http or https.");
  }
  return url.toString().replace(/\/+$/, "");
}

export function loadConfig(): ToolAtriumConfig {
  return { appBaseUrl: parseBaseUrl(process.env.TOOLATRIUM_BASE_URL) };
}
