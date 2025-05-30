export type Priority = 'high' | 'medium' | 'low';

// This interface describes the structure of a single task object AS RETURNED BY THE API
export interface ApiTaskResponseItem {
  id: string;
  task_name: string;
  description: string;
  due_date?: string; // Assuming due_date can be missing, like in your local Task type
  priority: 'High' | 'Medium' | 'Low' | string; // API sends capitalized, allow other strings for flexibility
  estimated_hours: string; // API sends as string e.g., "2.50"
  status: string; // e.g., "Not Started", "Completed", "In Progress"
  // Add any other fields that your API task object might have
}

// This is your local Task representation, used within the frontend application
export interface Task {
  id: string;
  name: string; // Will be mapped from task_name
  description: string;
  dueDate?: Date; // Will be mapped from due_date and parsed
  priority: Priority; // Will be mapped from priority (and lowercased)
  estimatedCompletionTime: number; // Will be mapped from estimated_hours and parsed
  completed: boolean; // Will be mapped from status
}

export interface ScheduledTaskItem {
  taskName: string;
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  reasoning: string;
}
