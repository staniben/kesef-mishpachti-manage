
import { useState } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { ExpenseChart } from "@/components/ExpenseChart";
import { ExpensesList } from "@/components/ExpensesList";
import { Button } from "@/components/ui/button";
import { Plus, FileExcel, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { exportToExcel } from "@/utils/exportUtils";
import { filterExpensesByMonth } from "@/utils/expenseUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filterId, setFilterId] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<"category" | "source" | undefined>();
  const { expenses, categories, paymentSources, currentMonth, currentYear } = useAppStore();
  
  const handleChartSliceClick = (id: string, type: "category" | "source") => {
    setFilterId(id);
    setFilterType(type);
  };
  
  const handleClearFilter = () => {
    setFilterId(undefined);
    setFilterType(undefined);
  };
  
  const handleAddExpense = () => {
    navigate("/add-expense");
  };
  
  const handleEditExpense = (id: string) => {
    navigate(`/edit-expense/${id}`);
  };
  
  const handleExportToExcel = () => {
    const monthlyExpenses = filterExpensesByMonth(expenses, currentMonth, currentYear);
    
    if (monthlyExpenses.length === 0) {
      toast({
        title: "אין נתונים להורדה",
        description: "לא נמצאו הוצאות בחודש הנבחר",
        variant: "destructive",
      });
      return;
    }
    
    // Create category and payment source maps for easy lookup
    const categoryMap: Record<string, string> = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
    
    const paymentSourceMap: Record<string, string> = {};
    paymentSources.forEach(src => {
      paymentSourceMap[src.id] = src.name;
    });
    
    // Export expenses
    exportToExcel(
      monthlyExpenses,
      categoryMap,
      paymentSourceMap,
      currentMonth,
      currentYear
    );
    
    toast({
      title: "דו״ח הורד בהצלחה",
      description: "קובץ האקסל הורד למחשב שלך",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportToExcel} variant="outline">
            <FileExcel className="h-4 w-4 ml-2" />
            ייצוא לאקסל
          </Button>
          <Button onClick={handleAddExpense}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף הוצאה
          </Button>
        </div>
      </div>
      
      <MonthSelector />
      
      {filterId && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilter}>
            נקה סינון
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {!filterId && (
          <ExpenseChart onSliceClick={handleChartSliceClick} />
        )}
        
        <ExpensesList
          filterId={filterId}
          filterType={filterType}
          onEditExpense={handleEditExpense}
        />
      </div>
    </div>
  );
}
