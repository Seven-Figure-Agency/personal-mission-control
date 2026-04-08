import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(getAllProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.project_name) {
    return NextResponse.json({ error: "project_name required" }, { status: 400 });
  }
  const id = createProject(body);
  const project = getAllProjects().find((p) => p.id === id);
  return NextResponse.json(project, { status: 201 });
}
