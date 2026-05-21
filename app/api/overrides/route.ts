import { NextResponse } from "next/server";
import {
  listOverrides,
  createOverride,
  deleteOverride,
} from "@/lib/services/overrides";

export async function GET() {
  return NextResponse.json(listOverrides());
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = createOverride({
    controlId: body.controlId,
    reasonCode: body.reasonCode,
    actionText: body.actionText,
    links: body.links,
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteOverride(id);
  return NextResponse.json({ ok: true });
}
