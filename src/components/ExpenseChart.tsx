
import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Expense, ExpenseCategory } from "@/types/models";
import { useAppStore } from "@/store";
import { Card, CardContent } from "./ui/card";
import { filterExpensesByMonth, groupExpensesByCategory } from "@/utils/expense";

interface ExpenseChartProps {
  year?: number;
  month?: number;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ year, month }) => {
  const expenses = useAppStore((state) => state.expenses);
  const categories = useAppStore((state) => state.categories);

  const filteredExpenses = useMemo(() => {
    let currentExpenses = expenses;
    if (year && month !== undefined) {
      currentExpenses = filterExpensesByMonth(expenses, year, month);
    }
    return currentExpenses;
  }, [expenses, year, month]);

  const groupedExpenses = useMemo(() => {
    return groupExpensesByCategory(filteredExpenses);
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    return Object.entries(groupedExpenses).map(([categoryId, expenses]) => {
      const category = categories.find((cat) => cat.id === categoryId);
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      return {
        name: category?.name || "Unknown",
        total,
      };
    });
  }, [groupedExpenses, categories]);

  return (
    <Card>
      <CardContent className="pl-2 pb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
