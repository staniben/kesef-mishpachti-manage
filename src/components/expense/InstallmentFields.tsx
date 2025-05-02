
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateTimeInputs } from "./DateTimeInputs";

interface InstallmentFieldsProps {
  totalAmount: string;
  numberOfInstallments: string;
  startDate: Date | undefined;
  onTotalAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumberOfInstallmentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartDateChange: (date: Date | undefined) => void;
}

export function InstallmentFields({
  totalAmount,
  numberOfInstallments,
  startDate,
  onTotalAmountChange,
  onNumberOfInstallmentsChange,
  onStartDateChange,
}: InstallmentFieldsProps) {
  return (
    <div className="space-y-6 mt-4 p-4 border border-dashed border-gray-300 rounded-md">
      <div className="text-lg font-medium">פרטי תשלומים</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalAmount">סכום כולל (₪)</Label>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            value={totalAmount}
            onChange={onTotalAmountChange}
            placeholder="הזן סכום כולל"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="numberOfInstallments">מספר תשלומים</Label>
          <Input
            id="numberOfInstallments"
            name="numberOfInstallments"
            type="number"
            value={numberOfInstallments}
            onChange={onNumberOfInstallmentsChange}
            placeholder="הזן מספר תשלומים"
            min="2"
            step="1"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <DateTimeInputs
            date={startDate}
            time="00:00"
            onDateChange={onStartDateChange}
            onTimeChange={() => {}}
            label="תאריך תשלום ראשון"
            timeLabel=""
            hideTime={true}
          />
        </div>
      </div>
    </div>
  );
}
