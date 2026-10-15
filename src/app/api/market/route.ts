import { getMarketSnapshot } from "@/server/market";

/** Client refresh endpoint. Server-side fetch keeps visitor IPs away from third-party APIs. */
export async function GET() {
  const snapshot = await getMarketSnapshot();
  return Response.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=240" },
  });
}
