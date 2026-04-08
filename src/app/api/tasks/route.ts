import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask, getTasksByProject } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (projectId) {
    return NextResponse.json(getTasksByProject(Number(projectId)));
  }
  const tasks = getAllTasks(true);
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.task_title) {
    return NextResponse.json({ error: "task_title required" }, { status: 400 });
  }
  const id = createTask(body);
  const task = getAllTasks(true).find((t) => t.id === id);
  return NextResponse.json(task, { status: 201 });
}
