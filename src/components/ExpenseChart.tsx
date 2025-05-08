
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { filterExpensesByMonth, groupExpensesByCategory, groupExpensesByPaymentSource } from "@/utils/expenseUtils";

type ChartDataItem = {
  name: string;
  value: number;
  color: string;
  id: string;
};

type ViewMode = "category" | "source";

export function ExpenseChart({ onSliceClick }: { onSliceClick?: (id: string, type: ViewMode) => void }) {
  const { expenses, categories, paymentSources, currentMonth, currentYear } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  // Filter expenses for current month
  const filteredExpenses = filterExpensesByMonth(expenses, currentMonth, currentYear);

  // Calculate data for the chart based on view mode
  const calculateChartData = (): ChartDataItem[] => {
    if (viewMode === "category") {
      // Group by category
      const categoryTotals = groupExpensesByCategory(filteredExpenses);
      
      // Map to chart data
      return Object.entries(categoryTotals).map(([categoryId, total]) => {
        const category = categories.find(cat => cat.id === categoryId);
        return {
          name: category?.name || "לא מוגדר",
          value: Number(total), // Ensure this is a number
          color: category?.color || "#999",
          id: categoryId
        };
      });
    } else {
      // Group by payment source
      const sourceTotals = groupExpensesByPaymentSource(filteredExpenses);
      
      // Map to chart data
      return Object.entries(sourceTotals).map(([sourceId, total]) => {
        const source = paymentSources.find(src => src.id === sourceId);
        return {
          name: source?.name || "לא מוגדר",
          value: Number(total), // Ensure this is a number
          color: source?.color || "#999",
          id: sourceId
        };
      });
    }
  };

  const data = calculateChartData();
  
  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-sm">
        <h3 className="text-xl font-medium mb-4">אין נתונים להצגה</h3>
        <p className="text-muted-foreground">לא נמצאו הוצאות בחודש הנוכחי</p>
      </div>
    );
  }

  const totalAmount = data.reduce((sum, item) => sum + item.value, 0);
  
  // Handle chart click
  const handleChartClick = (data: any, index: number) => {
    if (onSliceClick && data[index]) {
      onSliceClick(data[index].id, viewMode);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">סיכום הוצאות</h3>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "category" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("category")}
          >
            לפי קטגוריה
          </Button>
          <Button 
            variant={viewMode === "source" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("source")}
          >
            לפי אמצעי תשלום
          </Button>
        </div>
      </div>

      <div className="text-center mb-4">
        <h4 className="text-lg font-medium">סה"כ: {totalAmount.toLocaleString()} ₪</h4>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            onClick={(_, index) => handleChartClick(data, index)}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value.toLocaleString()} ₪`} 
            contentStyle={{ direction: 'rtl', textAlign: 'right' }}
          />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
