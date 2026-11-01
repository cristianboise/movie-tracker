import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

// PNG icons for the web app manifest, e.g. /pwa-icon/192 and /pwa-icon/512
const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = Number(sizeParam);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });

  return new ImageResponse(<AppIcon size={size} />, { width: size, height: size });
}
