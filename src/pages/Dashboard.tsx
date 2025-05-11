
import { useState, useEffect } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { ExpenseChart } from "@/components/ExpenseChart";
import { ExpensesList } from "@/components/ExpensesList";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { exportToExcel } from "@/utils/exportUtils";
import { filterExpensesByMonth, getCurrentFinancialMonth } from "@/utils/expenseUtils";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filterId, setFilterId] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<"category" | "source" | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    expenses, 
    categories, 
    paymentSources, 
    currentMonth, 
    currentYear, 
    financialMonthStartDay, 
    setCurrentMonth, 
    setCurrentYear,
    refreshAllData 
  } = useAppStore();
  const { user, refreshSession } = useAuth();
  
  // Set the initial financial month when the dashboard loads
  useEffect(() => {
    // Get the current financial month based on today's date and financial month start day
    const { month, year } = getCurrentFinancialMonth(financialMonthStartDay);
    
    // Only update if different to avoid unnecessary re-renders
    if (month !== currentMonth || year !== currentYear) {
      setCurrentMonth(month);
      setCurrentYear(year);
    }
  }, [financialMonthStartDay]); // Re-run if financial month start day changes
  
  // Initial data loading check
  useEffect(() => {
    const checkDataLoaded = async () => {
      // If we have a user but no data, try refreshing
      if (user && (!expenses.length || !categories.length || !paymentSources.length)) {
        console.log("User authenticated but data missing, refreshing...");
        await handleRefreshData();
      }
    };
    
    checkDataLoaded();
  }, [user]);  // Only run when user changes
  
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
    const monthlyExpenses = filterExpensesByMonth(
      expenses, 
      currentMonth, 
      currentYear,
      financialMonthStartDay
    );
    
    if (monthlyExpenses.length === 0) {
      toast({
        title: "אין נתונים להורדה",
        description: "לא נמצאו הוצאות בחודש הפיננסי הנבחר",
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
  
  // Function to manually refresh data
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      
      // First refresh the auth session to ensure token validity
      await refreshSession();
      
      // Then refresh all data
      await refreshAllData();
      
      toast({
        title: "הנתונים רועננו",
        description: "הנתונים עודכנו בהצלחה",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "שגיאה בריענון הנתונים",
        description: "אירעה שגיאה בעת ריענון הנתונים",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefreshData} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'מרענן...' : 'רענן נתונים'}
          </Button>
          <Button onClick={handleExportToExcel} variant="outline">
            <FileDown className="h-4 w-4 ml-2" />
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
