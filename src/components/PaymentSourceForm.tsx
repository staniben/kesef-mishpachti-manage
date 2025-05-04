
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PaymentSource } from "@/types/models";
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from "@/components/ui/checkbox";

interface PaymentSourceFormProps {
  source?: PaymentSource;
  onSave: (source: PaymentSource) => void;
  onCancel: () => void;
}

export function PaymentSourceForm({ source, onSave, onCancel }: PaymentSourceFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(source?.name || "");
  const [type, setType] = useState<"cash" | "credit" | "bank" | "other">(source?.type || "credit");
  const [color, setColor] = useState(source?.color || "#2196F3");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!name.trim()) {
        toast({
          title: "שגיאה",
          description: "שם אמצעי התשלום לא יכול להיות ריק",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const paymentSource: PaymentSource = {
        id: source?.id || uuidv4(),
        name: name.trim(),
        type,
        color: color || "#2196F3", // Ensure color has a default
      };
      
      console.log("Submitting payment source:", paymentSource);
      onSave(paymentSource);
      
      // Reset form
      setName("");
      setType("credit");
      setColor("#2196F3");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת אמצעי התשלום",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sourceName">שם אמצעי התשלום</Label>
        <Input
          id="sourceName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="הזן שם אמצעי תשלום"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sourceType">סוג אמצעי תשלום</Label>
        <Select value={type} onValueChange={(value) => setType(value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="בחר סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">מזומן</SelectItem>
            <SelectItem value="credit">כרטיס אשראי</SelectItem>
            <SelectItem value="bank">העברה בנקאית</SelectItem>
            <SelectItem value="other">אחר</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sourceColor">צבע</Label>
        <div className="flex items-center gap-2">
          <Input
            id="sourceColor"
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "שומר..." : source ? "עדכון" : "הוספה"}
        </Button>
      </div>
    </form>
  );
}
