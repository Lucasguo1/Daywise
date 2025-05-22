"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/daywise/AppHeader";
import { TaskForm } from "@/components/daywise/TaskForm";
import { TaskList } from "@/components/daywise/TaskList";
import { ScheduleView } from "@/components/daywise/ScheduleView";
import type { Task, ScheduledTaskItem, Priority } from "@/lib/types";
import { generateScheduleAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { isToday, isFuture, parseISO } from "date-fns";

export default function DayWisePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskItem[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const { toast } = useToast();

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const storedTasks = localStorage.getItem("daywiseTasks");
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // Save tasks to localStorage whenever tasks state changes
  useEffect(() => {
    localStorage.setItem("daywiseTasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({
      title: "Task Added",
      description: `"${newTask.name}" has been added to your list.`,
    });
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast({
      title: "Task Deleted",
      variant: "destructive",
    });
  };

  const handleSuggestSchedule = async () => {
    const activeTasks = tasks.filter(task => !task.completed);
    if (activeTasks.length === 0) {
      toast({
        title: "No Active Tasks",
        description: "Add some tasks or uncomplete existing ones to generate a schedule.",
        variant: "default",
      });
      setScheduledTasks([]);
      return;
    }

    setIsLoadingSchedule(true);
    const result = await generateScheduleAction(activeTasks);
    setIsLoadingSchedule(false);

    if ("error" in result) {
      toast({
        title: "Scheduling Error",
        description: result.error,
        variant: "destructive",
      });
      setScheduledTasks([]);
    } else {
      setScheduledTasks(result.schedule);
      toast({
        title: "Schedule Generated",
        description: "AI has suggested a new schedule for your tasks.",
      });
    }
  };

  const todayTasks = tasks.filter(
    (task) => !task.completed && task.dueDate && isToday(task.dueDate)
  );
  const upcomingTasks = tasks.filter(
    (task) => !task.completed && (!task.dueDate || isFuture(task.dueDate))
  );
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-grow">
        <TaskForm onAddTask={handleAddTask} />
        
        <div className="grid lg:grid-cols-2 gap-8">
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
          <div className="lg:sticky lg:top-8 h-fit"> {/* Make schedule view sticky on large screens */}
            <ScheduleView
              scheduledTasks={scheduledTasks}
              onSuggestSchedule={handleSuggestSchedule}
              isLoading={isLoadingSchedule}
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        DayWise - Your Personal Day Planner
      </footer>
    </div>
  );
}
