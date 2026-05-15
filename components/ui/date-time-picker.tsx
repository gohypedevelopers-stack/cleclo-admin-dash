"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DateTimePickerProps) {
  // datetime-local value is usually "YYYY-MM-DDTHH:mm"
  const date = value ? new Date(value) : undefined;
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    const currentDate = date && !isNaN(date.getTime()) ? date : new Date();
    const newDate = new Date(selectedDate);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());
    
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // HH:mm
    if (!timeValue) return;
    
    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = date && !isNaN(date.getTime()) ? new Date(date) : new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const isValidDate = date && !isNaN(date.getTime());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-white border-slate-200 hover:bg-slate-50 transition-colors",
            !isValidDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#3E8940]" />
          {isValidDate ? (
            <span className="text-slate-700">{format(date, "PPP p")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-slate-200" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? date : undefined}
          onSelect={handleDateSelect}
          initialFocus
          className="rounded-t-xl"
        />
        <div className="p-3 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 rounded-b-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            Time
          </div>
          <Input
            type="time"
            value={isValidDate ? format(date, "HH:mm") : ""}
            onChange={handleTimeChange}
            className="flex-1 h-9 bg-white border-slate-200 focus:ring-[#3E8940]/20 focus:border-[#3E8940]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
