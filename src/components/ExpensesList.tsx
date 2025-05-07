
import React, { useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { filterExpensesByMonth, sortExpensesByDate } from "@/utils/expense";

interface ExpensesListProps {
  categoryId?: string;
  filterId?: string;
  filterType?: "category" | "source";
  onEditExpense?: (id: string) => void;
}

export function ExpensesList({ categoryId, filterId, filterType, onEditExpense }: ExpensesListProps) {
  const currentMonth = useAppStore((state) => state.currentMonth);
  const currentYear = useAppStore((state) => state.currentYear);
  const expenses = useAppStore((state) => state.expenses);
  const categories = useAppStore((state) => state.categories);
  const paymentSources = useAppStore((state) => state.paymentSources);

  const filteredExpenses = useMemo(() => {
    let monthlyExpenses = filterExpensesByMonth(expenses, currentYear, currentMonth);

    if (categoryId) {
      monthlyExpenses = monthlyExpenses.filter((expense) => expense.categoryId === categoryId);
    }
    
    if (filterId && filterType) {
      if (filterType === "category") {
        monthlyExpenses = monthlyExpenses.filter((expense) => expense.categoryId === filterId);
      } else if (filterType === "source") {
        monthlyExpenses = monthlyExpenses.filter((expense) => expense.paymentSourceId === filterId);
      }
    }

    return sortExpensesByDate(monthlyExpenses);
  }, [expenses, currentMonth, currentYear, categoryId, filterId, filterType]);

  if (!filteredExpenses || filteredExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Expenses</CardTitle>
        </CardHeader>
        <CardContent>No expenses found for this month.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="list-none p-0">
          {filteredExpenses.map((expense) => {
            const category = categories.find((cat) => cat.id === expense.categoryId);
            const paymentSource = paymentSources.find((source) => source.id === expense.paymentSourceId);

            return (
              <li key={expense.id} className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{expense.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(new Date(expense.date))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 font-bold">₪{expense.amount}</div>
                    {category && (
                      <Badge className="mr-2" style={{ backgroundColor: category.color, color: 'white' }}>
                        {category.name}
                      </Badge>
                    )}
                    {paymentSource && (
                      <Badge variant="secondary">{paymentSource.name}</Badge>
                    )}
                  </div>
                </div>
                <Separator className="my-2" />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
