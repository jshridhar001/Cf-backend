/**
 * gantt-task-react Task-compatible payload (domain fields only).
 * Frontend should parse `start` / `end` with `new Date(...)` before passing to <Gantt />.
 */
export type GanttTaskPayload = {
  id: string;
  name: string;
  type: "task" | "milestone" | "project";
  start: string;
  end: string;
  progress: number;
  dependencies?: string[];
  project?: string;
};

type GanttSourceRow = {
  id: string;
  name: string;
  type: "task" | "milestone" | "project";
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[] | null;
  project: string | null;
};

export function toGanttTask(row: GanttSourceRow): GanttTaskPayload {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    start: row.startDate,
    end: row.endDate,
    progress: row.progress,
    ...(row.dependencies?.length ? { dependencies: row.dependencies } : {}),
    ...(row.project ? { project: row.project } : {}),
  };
}
