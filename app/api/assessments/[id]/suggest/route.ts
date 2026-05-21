import { NextResponse } from "next/server";
import { getControlById } from "@/lib/controls/catalog";
import { suggestCorrectiveAction } from "@/lib/corrective/suggest";
import { listOverrides } from "@/lib/services/overrides";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const control = getControlById(body.controlId);
    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }
    const overrides = await listOverrides();
    const result = suggestCorrectiveAction(
      control,
      body.notInPlaceReason ?? "",
      overrides
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
