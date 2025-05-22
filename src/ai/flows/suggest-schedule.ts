// src/ai/flows/suggest-schedule.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting a daily schedule to the user.
 *
 * - suggestSchedule - A function that suggests a schedule for the user's tasks.
 * - SuggestScheduleInput - The input type for the suggestSchedule function.
 * - SuggestScheduleOutput - The return type for the suggestSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleInputSchema = z.object({
  tasks: z.array(
    z.object({
      name: z.string().describe('The name of the task.'),
      description: z.string().describe('A detailed description of the task.'),
      dueDate: z.string().optional().describe('The due date of the task in ISO format, e.g., 2024-04-20T10:00:00Z'),
      priority: z.enum(['high', 'medium', 'low']).describe('The priority of the task.'),
      estimatedCompletionTime: z.string().describe('The estimated completion time of the task in hours.'),
    })
  ).describe('A list of tasks to schedule.')
});

export type SuggestScheduleInput = z.infer<typeof SuggestScheduleInputSchema>;

const SuggestScheduleOutputSchema = z.object({
  schedule: z.array(
    z.object({
      taskName: z.string().describe('The name of the scheduled task.'),
      startTime: z.string().describe('The suggested start time for the task in ISO format, e.g., 2024-04-20T09:00:00Z'),
      endTime: z.string().describe('The suggested end time for the task in ISO format, e.g., 2024-04-20T10:00:00Z'),
      reasoning: z.string().describe('The reasoning behind scheduling the task at this time.'),
    })
  ).describe('The suggested schedule for the tasks.'),
});

export type SuggestScheduleOutput = z.infer<typeof SuggestScheduleOutputSchema>;

export async function suggestSchedule(input: SuggestScheduleInput): Promise<SuggestScheduleOutput> {
  return suggestScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSchedulePrompt',
  input: {schema: SuggestScheduleInputSchema},
  output: {schema: SuggestScheduleOutputSchema},
  prompt: `You are an AI scheduling assistant. Given the following list of tasks, create a schedule for the user.  Take into account the priority, due date, and estimated completion time of each task.

Tasks:
{{#each tasks}}
- Name: {{this.name}}
  Description: {{this.description}}
  Due Date: {{this.dueDate}}
  Priority: {{this.priority}}
  Estimated Completion Time: {{this.estimatedCompletionTime}} hours
{{/each}}

Schedule:
{{#each schedule}}
- Task Name: {{this.taskName}}
  Start Time: {{this.startTime}}
  End Time: {{this.endTime}}
  Reasoning: {{this.reasoning}}
{{/each}}

Return a JSON response with the suggested schedule and reasoning for each task's placement.
`,
});

const suggestScheduleFlow = ai.defineFlow(
  {
    name: 'suggestScheduleFlow',
    inputSchema: SuggestScheduleInputSchema,
    outputSchema: SuggestScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
