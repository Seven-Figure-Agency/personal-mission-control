import { getAllProjects } from "@/lib/queries";
import ProjectsClient from "@/components/projects/ProjectsClient";

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Projects</h2>
        <p className="text-xs text-text-tertiary font-ui mt-0.5">
          {projects.filter(p => p.status === "In Progress").length} active · {projects.length} total
        </p>
      </div>
      <ProjectsClient initialProjects={projects} />
    </div>
  );
}
