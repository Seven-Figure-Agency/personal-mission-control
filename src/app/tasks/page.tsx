import { getAllTasks } from "@/lib/queries";
import TaskBoard from "@/components/tasks/TaskBoard";

export default function TasksPage() {
  const allTasks = getAllTasks(true);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Tasks</h2>
        <p className="text-xs text-text-tertiary font-ui mt-0.5">
          {allTasks.filter(t => t.status !== "Completed").length} active · {allTasks.filter(t => t.status === "Completed").length} done
        </p>
      </div>
      <TaskBoard initialTasks={allTasks} />
    </div>
  );
}
