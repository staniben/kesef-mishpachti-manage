
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExpenseCategory } from "@/types";

interface CategoryFormProps {
  category?: ExpenseCategory;
  onSave: (category: ExpenseCategory) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#4CAF50");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הקטגוריה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }
    
    onSave({
      id: category?.id || new Date().getTime().toString(),
      name,
      color,
    });
    
    // Reset form
    setName("");
    setColor("#4CAF50");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryName">שם הקטגוריה</Label>
        <Input
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="הזן שם קטגוריה"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="categoryColor">צבע</Label>
        <div className="flex items-center gap-2">
          <Input
            id="categoryColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <div 
            className="w-10 h-10 rounded-md border"
            style={{ backgroundColor: color }}
          />
          <Input 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="flex-1"
            maxLength={7}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit">
          {category ? "עדכון" : "הוספה"}
        </Button>
      </div>
    </form>
  );
}
