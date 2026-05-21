import { NextResponse } from "next/server";
import { ALL_CONTROLS } from "@/lib/controls/catalog";

export async function GET() {
  return NextResponse.json({
    count: ALL_CONTROLS.length,
    controls: ALL_CONTROLS,
  });
}
