
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";

interface InstallmentFieldsProps {
  installmentNumber: string;
  totalInstallments: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function InstallmentFields({ 
  installmentNumber,
  totalInstallments,
  onChange
}: InstallmentFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="totalInstallments">מספר תשלומים</Label>
        <Input
          id="totalInstallments"
          name="totalInstallments"
          type="number"
          min="1"
          value={totalInstallments}
          onChange={onChange}
        />
        <p className="text-sm text-muted-foreground">
          סכום ההוצאה יחולק באופן שווה בין כל התשלומים
        </p>
      </div>
    </>
  );
}
