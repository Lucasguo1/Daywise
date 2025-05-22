"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task, Priority } from "@/lib/types";
import { format } from "date-fns";
import { CalendarDays, Clock, Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const priorityVariantMap: Record<Priority, "default" | "secondary" | "destructive"> = {
  high: "destructive",
  medium: "default", // Using default for medium as primary in DayWise
  low: "secondary",
};

const priorityTextMap: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export function TaskItem({ task, onToggleComplete, onDeleteTask }: TaskItemProps) {
  return (
    <Card className={`transition-all duration-300 ease-in-out hover:shadow-xl ${task.completed ? "opacity-60 bg-muted/50" : "bg-card"}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className={`text-xl ${task.completed ? "line-through" : ""}`}>{task.name}</CardTitle>
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
            className="ml-4 mt-1"
          />
        </div>
        <CardDescription className={`${task.completed ? "line-through" : ""}`}>{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Badge variant={priorityVariantMap[task.priority]}>{priorityTextMap[task.priority]} Priority</Badge>
        </div>
        {task.dueDate && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Due: {format(task.dueDate, "PPP")}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Est. Time: {task.estimatedCompletionTime} hour(s)</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onDeleteTask(task.id)} aria-label="Delete task">
          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
