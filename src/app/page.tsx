"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/daywise/AppHeader";
import { TaskForm } from "@/components/daywise/TaskForm";
import { TaskList } from "@/components/daywise/TaskList";
import type { Task, Priority, ApiTaskResponseItem } from "@/lib/types"; // Ensured ApiTaskResponseItem is imported
import {
  fetchTasksFromApi,
  deleteTaskFromApi,
  updateTaskStatusInApi,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { isToday, isFuture, parseISO } from "date-fns";

// Corrected mapApiTaskToLocalTask function
const mapApiTaskToLocalTask = (apiTask: ApiTaskResponseItem): Task => {
  return {
    id: apiTask.id,
    name: apiTask.task_name, // Corrected: use task_name from API
    description: apiTask.description,
    dueDate: apiTask.due_date ? parseISO(apiTask.due_date) : undefined, // Corrected: use due_date
    priority: apiTask.priority.toLowerCase() as Priority,
    estimatedCompletionTime: parseFloat(apiTask.estimated_hours), // Corrected: use estimated_hours
    completed: apiTask.status === "Completed", // Corrected: derive from API's status field
  };
};

export default function DayWisePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const deviceIdFromStorage = localStorage.getItem("userDeviceId");
    if (deviceIdFromStorage) {
      setCurrentDeviceId(deviceIdFromStorage);
    } else {
      setCurrentDeviceId(null); // Explicitly set to null if not found
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    setTasksError(null);
    let deviceIdToUse = currentDeviceId;
    // Ensure deviceIdToUse is resolved before API call if currentDeviceId is initially null
    if (!deviceIdToUse) {
      const storedId = localStorage.getItem('userDeviceId');
      if (storedId) {
        deviceIdToUse = storedId;
        setCurrentDeviceId(storedId); // Update state if fetched from storage
      }
    }
    // Proceed with API call only if a deviceId is available (or if fetching 'all' is intended)
    // The fetchTasksFromApi function handles the case where deviceIdToUse is undefined (fetches all)
    const result = await fetchTasksFromApi(deviceIdToUse || undefined);
    if (result.tasks) {
      const mappedTasks = result.tasks.map(mapApiTaskToLocalTask);
      setTasks(mappedTasks);
    } else if (result.error) {
      setTasksError(result.error);
      toast({
        title: "Error Loading Tasks",
        description: result.error,
        variant: "destructive",
      });
    } else {
      // Handle case where result has no tasks and no error (e.g., successful empty response)
      setTasks([]); // Set to empty array if no tasks are returned
    }
    setIsLoadingTasks(false);
  }, [toast, currentDeviceId]); // Added currentDeviceId to dependency array

  useEffect(() => {
    // Trigger loadTasks when currentDeviceId is resolved (or on initial load if already present)
    // This also handles the case where currentDeviceId might be set asynchronously from localStorage
    if (currentDeviceId !== null || !localStorage.getItem("userDeviceId")) {
        // if currentDeviceId is set OR if there's no deviceId in storage (meaning we might fetch 'all' or wait for TaskForm)
        loadTasks();
    }
  }, [loadTasks, currentDeviceId]); // Added currentDeviceId

  const handleApiTaskAdded = () => {
    toast({
      title: "Task Submitted",
      description: "New task sent to the server. Refreshing list...",
    });
    loadTasks();
  };

  const handleToggleComplete = async (taskId: string) => {
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;
    if (!currentDeviceId) {
      toast({ title: "Error", description: "Device ID not found. Cannot update task.", variant: "destructive" });
      return;
    }
    const newCompletedStatus = !taskToToggle.completed;
    const result = await updateTaskStatusInApi(taskId, newCompletedStatus, currentDeviceId);
    if (result.success) {
      toast({ title: "Task Updated", description: `Task status changed on server.` });
      loadTasks();
    } else {
      toast({ title: "Update Failed", description: result.error || "Could not update task on server.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentDeviceId) {
      toast({ title: "Error", description: "Device ID not found. Cannot delete task.", variant: "destructive" });
      return;
    }
    const result = await deleteTaskFromApi(taskId, currentDeviceId);
    if (result.success) {
      toast({ title: "Task Deleted", description: "Task removed from server." });
      loadTasks();
    } else {
      toast({ title: "Delete Failed", description: result.error || "Could not delete task on server.", variant: "destructive" });
    }
  };

  const todayTasks = tasks.filter(
    (task) => !task.completed && task.dueDate && isToday(task.dueDate)
  );
  const upcomingTasks = tasks.filter(
    (task) => !task.completed && (!task.dueDate || isFuture(task.dueDate))
  );
  const completedTasks = tasks.filter((task) => task.completed);
  
  // console.log lines are commented out but can be re-enabled for debugging.

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-grow">
        <TaskForm onApiTaskAdded={handleApiTaskAdded} />
        
        <section className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
          <h2 className="text-xl font-semibold text-primary">Your Tasks</h2>
          {isLoadingTasks && <p>Loading tasks from server...</p>}
          {tasksError && <p className="text-red-500">Error loading tasks: {tasksError}</p>}
          {!isLoadingTasks && !tasksError && tasks.length === 0 && (
            <p>No tasks found for this device. Add one above or check device ID!</p>
          )}
        </section>

        {!isLoadingTasks && !tasksError && tasks.length > 0 && (
          <div className="space-y-8">
            <TaskList
              title="Today's Tasks"
              tasks={todayTasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              emptyStateMessage="No tasks due today. Great job or add some!"
            />
            <TaskList
              title="Upcoming Tasks"
              tasks={upcomingTasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              emptyStateMessage="No upcoming tasks. Plan ahead!"
            />
            <TaskList
              title="Completed Tasks"
              tasks={completedTasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              emptyStateMessage="No tasks completed yet. Get to it!"
            />
          </div>
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        DayWise - Your Personal Day Planner
      </footer>
    </div>
  );
}
