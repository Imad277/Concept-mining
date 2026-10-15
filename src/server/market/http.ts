import type { z } from "zod";
import type { FetchLike } from "./provider";
import { MarketProviderError } from "./provider";

export interface HttpOptions {
  fetch: FetchLike;
  timeoutMs: number;
  revalidateSeconds: number;
}

/** GET + timeout + schema validation. External data is untrusted until parsed. */
export async function getJson<S extends z.ZodType>(providerId: string, url: string, schema: S, opts: HttpOptions): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await opts.fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(opts.timeoutMs),
      next: { revalidate: opts.revalidateSeconds },
    });
  } catch (cause) {
    throw new MarketProviderError(providerId, `request failed: ${url}`, { cause });
  }
  if (!res.ok) throw new MarketProviderError(providerId, `HTTP ${res.status} for ${url}`);
  let body: unknown;
  try {
    body = await res.json();
  } catch (cause) {
    throw new MarketProviderError(providerId, `invalid JSON from ${url}`, { cause });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new MarketProviderError(providerId, `unexpected response shape from ${url}: ${parsed.error.message}`);
  return parsed.data;
}
