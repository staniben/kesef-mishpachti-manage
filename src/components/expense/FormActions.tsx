
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  isEditing: boolean;
}

export function FormActions({ isSubmitting, isEditing }: FormActionsProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-end gap-4 pt-4">
      <Button type="button" variant="outline" onClick={() => navigate("/")}>
        ביטול
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "שומר..." : isEditing ? "עדכון" : "הוספה"}
      </Button>
    </div>
  );
}
