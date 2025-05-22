"use client";

import type { Task } from "@/lib/types";
import { TaskItem } from "./TaskItem";
import { ListTodo, CheckCircle2, CalendarClock } from "lucide-react";

interface TaskListProps {
  title: string;
  tasks: Task[];
  icon?: React.ReactNode;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  emptyStateMessage?: string;
}

const iconMap: { [key: string]: React.ReactNode } = {
  "Today's Tasks": <CalendarClock className="h-6 w-6 text-primary" />,
  "Upcoming Tasks": <ListTodo className="h-6 w-6 text-primary" />,
  "Completed Tasks": <CheckCircle2 className="h-6 w-6 text-green-500" />,
};

export function TaskList({ title, tasks, onToggleComplete, onDeleteTask, emptyStateMessage = "No tasks here yet!" }: TaskListProps) {
  const displayIcon = iconMap[title] || <ListTodo className="h-6 w-6 text-primary" />;
  
  return (
    <section className="space-y-4 p-6 border rounded-lg shadow-lg bg-card">
      <div className="flex items-center space-x-3 mb-4">
        {displayIcon}
        <h2 className="text-2xl font-semibold text-primary">{title}</h2>
      </div>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground italic">{emptyStateMessage}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </section>
  );
}
