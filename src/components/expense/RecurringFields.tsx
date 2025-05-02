
import { DateTimeInputs } from "./DateTimeInputs";

interface RecurringFieldsProps {
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
}

export function RecurringFields({
  startDate,
  onStartDateChange,
}: RecurringFieldsProps) {
  return (
    <div className="space-y-4">
      <DateTimeInputs
        date={startDate}
        time=""
        onDateChange={onStartDateChange}
        onTimeChange={() => {}}
        label="תאריך התחלה"
        dateLabel="תאריך התחלה (יחזור כל חודש במשך שנה)"
        hideTime={true}
      />
    </div>
  );
}
