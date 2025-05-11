
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        className="text-sm cursor-pointer flex items-center gap-1"
      >
        זכור אותי
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger type="button">
              <InfoCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                סמן כדי להישאר מחובר גם לאחר סגירת הדפדפן. 
                אם לא תסמן, תצטרך להתחבר מחדש בכל פעם.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
    </div>
  );
}
