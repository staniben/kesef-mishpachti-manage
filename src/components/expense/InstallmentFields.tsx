
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
        <Label htmlFor="installmentNumber">מספר תשלום</Label>
        <Input
          id="installmentNumber"
          name="installmentNumber"
          type="number"
          min="1"
          value={installmentNumber}
          onChange={onChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="totalInstallments">סה"כ תשלומים</Label>
        <Input
          id="totalInstallments"
          name="totalInstallments"
          type="number"
          min="1"
          value={totalInstallments}
          onChange={onChange}
        />
      </div>
    </>
  );
}
