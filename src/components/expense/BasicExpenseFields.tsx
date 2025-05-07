
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseCategory, PaymentSource } from "@/types";

interface BasicExpenseFieldsProps {
  name: string;
  amount: string;
  categoryId: string;
  paymentSourceId: string;
  categories: ExpenseCategory[];
  paymentSources: PaymentSource[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  disableAmount?: boolean;
}

export function BasicExpenseFields({
  name,
  amount,
  categoryId,
  paymentSourceId,
  categories,
  paymentSources,
  onInputChange,
  onSelectChange,
  disableAmount = false
}: BasicExpenseFieldsProps) {
   console.log("Categories in UI:", categories);
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">שם ההוצאה</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onInputChange}
          placeholder="שם ההוצאה"
          required
        />
      </div>
      
      {!disableAmount && (
        <div className="space-y-2">
          <Label htmlFor="amount">סכום (₪)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={amount}
            onChange={onInputChange}
            placeholder="הזן סכום"
            min="0"
            step="0.01"
            required={!disableAmount}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="categoryId">קטגוריה</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => onSelectChange("categoryId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paymentSourceId">אמצעי תשלום</Label>
        <Select
          value={paymentSourceId}
          onValueChange={(value) => onSelectChange("paymentSourceId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר אמצעי תשלום" />
          </SelectTrigger>
          <SelectContent>
            {paymentSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
