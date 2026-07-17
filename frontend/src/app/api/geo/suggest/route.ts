import { NextResponse, type NextRequest } from "next/server";
import { suggestPlaces } from "@/lib/geo/yandexGeo";

/**
 * GET /api/geo/suggest — подсказки мест для поля «Место».
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text") ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken") ?? "";
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");

  if (!sessionToken) {
    return NextResponse.json({ error: "sessionToken_required" }, { status: 400 });
  }

  try {
    const near =
      lat && lng
        ? { lat: Number(lat), lng: Number(lng) }
        : undefined;
    const results = await suggestPlaces(text, {
      sessionToken,
      near:
        near && Number.isFinite(near.lat) && Number.isFinite(near.lng)
          ? near
          : undefined,
    });
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "suggest_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
