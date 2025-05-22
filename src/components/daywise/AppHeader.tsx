"use client";

import { CalendarCheck } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary/10 py-6 shadow-md">
      <div className="container mx-auto flex items-center space-x-3">
        <CalendarCheck className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold text-primary">DayWise</h1>
      </div>
    </header>
  );
}
