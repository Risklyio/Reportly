import { NextResponse } from "next/server";
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/services/templates";

export async function GET() {
  return NextResponse.json(listTemplates());
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string) || "Report template";
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const id = saveTemplate(name, file.name, buffer);
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
