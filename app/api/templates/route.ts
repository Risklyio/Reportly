import { NextResponse } from "next/server";
import {
  listTemplates,
  saveTemplate,
  deleteTemplate,
} from "@/lib/services/templates";

export async function GET() {
  try {
    return NextResponse.json(await listTemplates());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Report template";
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const id = await saveTemplate(name, file.name, buffer);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await deleteTemplate(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
