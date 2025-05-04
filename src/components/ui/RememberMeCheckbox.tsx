
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RememberMeCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function RememberMeCheckbox({ 
  checked, 
  onCheckedChange,
  className = "" 
}: RememberMeCheckboxProps) {
  return (
    <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
      <Checkbox 
        id="persistSession" 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
      />
      <Label 
        htmlFor="persistSession" 
        className="text-sm cursor-pointer"
      >
        זכור אותי
      </Label>
    </div>
  );
}
