
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
import { useAppStore } from "@/store";
import { filterExpensesByMonth, sortExpensesByDate } from "@/utils/expenseUtils";

type ExpensesListProps = {
  filterId?: string;
  filterType?: "category" | "source";
  onEditExpense?: (id: string) => void;
};

export function ExpensesList({ filterId, filterType, onEditExpense }: ExpensesListProps) {
  const { 
    expenses, 
    categories, 
    paymentSources, 
    currentMonth, 
    currentYear, 
    financialMonthStartDay, 
    deleteExpense 
  } = useAppStore();
  
  // Filter expenses for current financial month and optional filter by category or source
  const filteredExpenses = expenses.filter(expense => {
    // First filter by the financial month
    const expenseDate = new Date(expense.date);
    
    // Calculate financial month boundaries
    const startDate = new Date(currentYear, currentMonth, financialMonthStartDay);
    const endDate = new Date(currentYear, currentMonth + 1, financialMonthStartDay);
    
    // Check if within financial month
    const isInFinancialMonth = expenseDate >= startDate && expenseDate < endDate;
    
    // Then apply category or source filter if provided
    if (!filterId) return isInFinancialMonth;
    
    if (filterType === "category") {
      return isInFinancialMonth && expense.categoryId === filterId;
    } else if (filterType === "source") {
      return isInFinancialMonth && expense.paymentSourceId === filterId;
    }
    
    return isInFinancialMonth;
  });
  
  // Sort expenses by date (newest first)
  const sortedExpenses = sortExpensesByDate(filteredExpenses);
  
  // Helper function to get category name
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "לא מוגדר";
  };
  
  // Helper function to get payment source name
  const getPaymentSourceName = (sourceId: string): string => {
    const source = paymentSources.find(src => src.id === sourceId);
    return source?.name || "לא מוגדר";
  };
  
  // Handle delete expense
  const handleDelete = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק הוצאה זו?")) {
      await deleteExpense(id);
    }
  };

  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-sm">
        <h3 className="text-xl font-medium mb-4">אין הוצאות להצגה</h3>
        <p className="text-muted-foreground">לא נמצאו הוצאות בחודש הפיננסי הנוכחי</p>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 overflow-hidden">
      <h3 className="text-xl font-medium mb-6">
        {filterId && filterType === "category" 
          ? `הוצאות בקטגוריה: ${getCategoryName(filterId)}`
          : filterId && filterType === "source"
          ? `הוצאות באמצעי תשלום: ${getPaymentSourceName(filterId)}`
          : "כל ההוצאות"}
      </h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך</TableHead>
              <TableHead>שם</TableHead>
              <TableHead>קטגוריה</TableHead>
              <TableHead>אמצעי תשלום</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell>{getCategoryName(expense.categoryId)}</TableCell>
                <TableCell>{getPaymentSourceName(expense.paymentSourceId)}</TableCell>
                <TableCell className="font-medium">₪ {expense.amount.toLocaleString()}</TableCell>
                <TableCell>
                  {expense.isInstallment && expense.installmentNumber && expense.totalInstallments ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-300">
                      תשלום {expense.installmentNumber} מתוך {expense.totalInstallments}
                    </Badge>
                  ) : expense.isRecurring ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-300">
                      תשלום קבוע
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300">
                      חד פעמי
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {onEditExpense && (
                      <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
