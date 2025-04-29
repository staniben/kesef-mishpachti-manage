
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthSelector() {
  const { currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useAppContext();
  
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 
    'מאי', 'יוני', 'יולי', 'אוגוסט', 
    'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const years = Array.from(
    { length: 10 }, 
    (_, i) => new Date().getFullYear() - 5 + i
  );
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="flex items-center justify-between bg-card shadow-sm rounded-lg p-2 mb-6">
      <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rtl-flip">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex gap-2">
        <Select
          value={currentMonth.toString()}
          onValueChange={(value) => setCurrentMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={months[currentMonth]} />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={currentYear.toString()}
          onValueChange={(value) => setCurrentYear(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={currentYear.toString()} />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rtl-flip">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
