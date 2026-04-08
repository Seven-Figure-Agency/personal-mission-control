import { getProjectById, getTasksByProject, getAllProjects } from "@/lib/queries";
import ProjectWorkspace from "@/components/workspace/ProjectWorkspace";
import { notFound } from "next/navigation";

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) notFound();

  const tasks = getTasksByProject(Number(id));
  const allProjects = getAllProjects().filter((p) => p.status !== "Complete");

  return (
    <ProjectWorkspace
      project={project}
      initialTasks={tasks}
      allProjects={allProjects}
    />
  );
}
