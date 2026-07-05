"use client";

import { useState, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function DashboardDatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  
  const [date, setDate] = useState(() => {
    return dateParam ? new Date(dateParam) : new Date();
  });
  
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();
  const displayText = isToday ? `Today, ${formattedDate}` : formattedDate;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      setDate(newDate);
      // Optional: Update URL to reflect selected date for data fetching
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", e.target.value);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => inputRef.current?.showPicker()}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
      >
        <Calendar className="h-4 w-4 text-slate-500" strokeWidth={2.5} />
        {displayText}
        <ChevronDown className="h-4 w-4 text-slate-500 ml-1" />
      </button>
      <input 
        ref={inputRef}
        type="date" 
        value={date.toISOString().slice(0, 10)}
        onChange={handleDateChange}
        className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none" 
      />
    </div>
  );
}
