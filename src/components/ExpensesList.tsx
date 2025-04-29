
import { useAppContext } from "@/context/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { ExpenseCategory, PaymentSource, PaymentType } from "@/types";

type ExpensesListProps = {
  filterId?: string;
  filterType?: "category" | "source";
  onEditExpense?: (id: string) => void;
};

export function ExpensesList({ filterId, filterType, onEditExpense }: ExpensesListProps) {
  const { expenses, categories, paymentSources, currentMonth, currentYear, deleteExpense } = useAppContext();
  
  // Filter expenses for current month and optional filter by category or source
  const filteredExpenses = expenses.filter(expense => {
    const date = new Date(expense.date);
    const monthMatches = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    
    if (!filterId) return monthMatches;
    
    if (filterType === "category") {
      return monthMatches && expense.categoryId === filterId;
    } else if (filterType === "source") {
      return monthMatches && expense.paymentSourceId === filterId;
    }
    
    return monthMatches;
  });
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
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
  
  // Helper function to format payment type
  const formatPaymentType = (type: PaymentType, expense: any): string => {
    switch (type) {
      case "one-time":
        return "חד פעמי";
      case "recurring":
        return "תשלום קבוע";
      case "installments":
        return `תשלום ${expense.installmentNumber} מתוך ${expense.totalInstallments}`;
      default:
        return "";
    }
  };
  
  // Handle delete expense
  const handleDelete = (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק הוצאה זו?")) {
      deleteExpense(id);
    }
  };

  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-sm">
        <h3 className="text-xl font-medium mb-4">אין הוצאות להצגה</h3>
        <p className="text-muted-foreground">לא נמצאו הוצאות בחודש הנוכחי</p>
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
              <TableHead>סוג תשלום</TableHead>
              <TableHead>סכום</TableHead>
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
                <TableCell>{formatPaymentType(expense.paymentType, expense)}</TableCell>
                <TableCell className="font-medium">₪ {expense.amount.toLocaleString()}</TableCell>
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
