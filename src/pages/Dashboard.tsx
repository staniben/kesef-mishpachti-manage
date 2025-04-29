
import { useState } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { ExpenseChart } from "@/components/ExpenseChart";
import { ExpensesList } from "@/components/ExpensesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [filterId, setFilterId] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<"category" | "source" | undefined>();
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <Button onClick={handleAddExpense}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף הוצאה
        </Button>
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
