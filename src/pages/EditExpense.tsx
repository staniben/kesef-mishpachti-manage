
import { ExpenseForm } from "@/components/ExpenseForm";
import { useParams, Navigate } from "react-router-dom";

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="space-y-6">
      <ExpenseForm editId={id} />
    </div>
  );
}
