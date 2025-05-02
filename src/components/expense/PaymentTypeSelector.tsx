
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaymentType } from "@/types";

interface PaymentTypeSelectorProps {
  paymentType: PaymentType;
  onPaymentTypeChange: (paymentType: PaymentType) => void;
}

export function PaymentTypeSelector({
  paymentType,
  onPaymentTypeChange,
}: PaymentTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>סוג תשלום</Label>
      <RadioGroup
        value={paymentType}
        onValueChange={(value) => onPaymentTypeChange(value as PaymentType)}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="one-time" id="one-time" />
          <Label htmlFor="one-time" className="cursor-pointer">תשלום חד פעמי</Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="installment" id="installment" />
          <Label htmlFor="installment" className="cursor-pointer">תשלומים</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
