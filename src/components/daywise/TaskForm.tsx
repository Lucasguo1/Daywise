"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
// Removed: import type { Priority, Task } from "@/lib/types"; - Task type no longer directly used for onAddTask
import { submitTaskToApi } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast"; // Added for error feedback

const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date().optional(),
  priority: z.enum(["high", "medium", "low"]),
  estimatedCompletionTime: z.string().min(1, "Estimated time is required (e.g., '1', '0.5')"),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Updated TaskFormProps interface
interface TaskFormProps {
  onApiTaskAdded: () => void; // Signal successful API submission to parent
}

export function TaskForm({ onApiTaskAdded }: TaskFormProps) {
  const { toast } = useToast(); // Initialize toast
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      estimatedCompletionTime: "1",
    },
  });

  async function onSubmit(values: TaskFormValues) {
    let deviceId = localStorage.getItem('userDeviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('userDeviceId', deviceId);
    }

    const priorityMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    const apiTaskData = {
      option: "insert" as const,
      task_name: values.name,
      description: values.description,
      due_date: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : "",
      priority: priorityMap[values.priority] as "Low" | "Medium" | "High",
      estimated_hours: parseFloat(values.estimatedCompletionTime),
      device: deviceId,
    };

    try {
      const result = await submitTaskToApi(apiTaskData);

      if (result.success) {
        toast({
          title: "Task Submitted to API",
          description: `"${apiTaskData.task_name}" sent to server.`,
        });
        onApiTaskAdded(); // Notify parent to refresh API task list
        form.reset();
      } else {
        console.error("Failed to submit task to API:", result.error);
        toast({
          title: "API Submission Error",
          description: result.error || "Could not submit task to the server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("An unexpected error occurred while submitting the task:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-lg shadow-lg bg-card">
        <h2 className="text-2xl font-semibold text-primary mb-4">Create New Task</h2>
        {/* FormFields remain the same */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter task name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the task" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedCompletionTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Time (hours)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g., 1 or 0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Task to API
        </Button>
      </form>
    </Form>
  );
}
