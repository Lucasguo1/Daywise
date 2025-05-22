export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate?: Date;
  priority: Priority;
  estimatedCompletionTime: string; // In hours, e.g., "1", "0.5"
  completed: boolean;
}

export interface ScheduledTaskItem {
  taskName: string;
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  reasoning: string;
}
