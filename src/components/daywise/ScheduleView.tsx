"use client";

import type { ScheduledTaskItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Clock3, MessageSquareText } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ScheduleViewProps {
  scheduledTasks: ScheduledTaskItem[];
  onSuggestSchedule: () => void;
  isLoading: boolean;
}

export function ScheduleView({ scheduledTasks, onSuggestSchedule, isLoading }: ScheduleViewProps) {
  return (
    <section className="space-y-4 p-6 border rounded-lg shadow-lg bg-card">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <Sparkles className="h-8 w-8 text-accent" />
          <h2 className="text-2xl font-semibold text-accent">AI Suggested Schedule</h2>
        </div>
        <Button onClick={onSuggestSchedule} disabled={isLoading}>
          {isLoading ? "Generating..." : "Suggest Schedule"}
          {!isLoading && <Sparkles className="ml-2 h-5 w-5" />}
        </Button>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">Generating schedule, please wait...</p>}
      
      {!isLoading && scheduledTasks.length === 0 && (
        <p className="text-muted-foreground italic text-center">
          No schedule suggested yet. Add some tasks and click "Suggest Schedule".
        </p>
      )}

      {!isLoading && scheduledTasks.length > 0 && (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {scheduledTasks.map((item, index) => (
              <Card key={index} className="bg-background/50 border-accent/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-accent">{item.taskName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock3 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span className="ml-1 text-muted-foreground">
                      {format(parseISO(item.startTime), "p")} - {format(parseISO(item.endTime), "p")}
                      {" on "}
                      {format(parseISO(item.startTime), "MMM d")}
                    </span>
                  </div>
                  <div className="flex items-start text-sm">
                    <MessageSquareText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className="font-medium">Reasoning:</span>
                      <CardDescription className="ml-1 text-muted-foreground inline">{item.reasoning}</CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
