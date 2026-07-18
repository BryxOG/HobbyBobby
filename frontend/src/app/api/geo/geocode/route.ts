import { NextResponse, type NextRequest } from "next/server";
import { resolvePlace, reverseGeocode } from "@/lib/geo/yandexGeo";

/**
 * GET /api/geo/geocode — прямой/обратный геокодинг и разрешение uri из Suggest.
 */
export async function GET(request: NextRequest) {
  const uri = request.nextUrl.searchParams.get("uri");
  const geocode = request.nextUrl.searchParams.get("geocode");
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  const referer =
    request.headers.get("referer") ??
    request.headers.get("origin") ??
    undefined;

  try {
    if (lat && lng) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        return NextResponse.json({ error: "invalid_coords" }, { status: 400 });
      }
      const place = await reverseGeocode(latNum, lngNum, { referer });
      return NextResponse.json({ place });
    }

    const place = await resolvePlace(
      {
        uri: uri ?? undefined,
        geocode: geocode ?? undefined,
      },
      { referer },
    );
    return NextResponse.json({ place });
  } catch (error) {
    const message = error instanceof Error ? error.message : "geocode_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
