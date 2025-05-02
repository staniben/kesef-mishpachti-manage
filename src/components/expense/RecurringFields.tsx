
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringFieldsProps {
  recurringEndDate: Date | undefined;
  startDate: Date | undefined;
  onRecurringEndDateChange: (date: Date | undefined) => void;
}

export function RecurringFields({ 
  recurringEndDate,
  startDate, 
  onRecurringEndDateChange
}: RecurringFieldsProps) {
  return (
    <div className="space-y-2">
      <Label>תאריך סיום</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-right font-normal",
              !recurringEndDate && "text-muted-foreground"
            )}
          >
            {recurringEndDate 
              ? format(recurringEndDate, "dd/MM/yyyy") 
              : "בחר תאריך סיום"}
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={recurringEndDate}
            onSelect={onRecurringEndDateChange}
            initialFocus
            disabled={(date) => date <= (startDate || new Date())}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
