"use server";

import { suggestSchedule, type SuggestScheduleInput, type SuggestScheduleOutput } from "@/ai/flows/suggest-schedule";
import type { Task } from "./types";

export async function generateScheduleAction(tasks: Task[]): Promise<SuggestScheduleOutput | { error: string }> {
  if (!tasks || tasks.length === 0) {
    return { schedule: [] }; // Return empty schedule if no tasks
  }

  const formattedTasks: SuggestScheduleInput["tasks"] = tasks
    .filter(task => !task.completed) // Only schedule non-completed tasks
    .map(task => ({
    name: task.name,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    priority: task.priority,
    estimatedCompletionTime: task.estimatedCompletionTime.toString(), // Ensure it's a string
  }));

  if (formattedTasks.length === 0) {
    return { schedule: [] }; // Return empty schedule if all tasks are completed
  }
  
  try {
    const result = await suggestSchedule({ tasks: formattedTasks });
    return result;
  } catch (error) {
    console.error("Error generating schedule:", error);
    return { error: "Failed to generate schedule. Please try again." };
  }
}
