
import React from "react";
import { BasicExpenseFields } from "./expense/BasicExpenseFields";
import { DateTimeInputs } from "./expense/DateTimeInputs";
import { FormActions } from "./expense/FormActions";
import { PaymentTypeSelector } from "./expense/PaymentTypeSelector";
import { InstallmentFields } from "./expense/InstallmentFields";
import { useExpenseForm } from "@/hooks/useExpenseForm";

interface ExpenseFormProps {
  editId?: string;
}

export function ExpenseForm({ editId }: ExpenseFormProps) {
  const {
    formData,
    isSubmitting,
    categories,
    paymentSources,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleStartDateChange,
    handlePaymentTypeChange,
    handleSubmit
  } = useExpenseForm(editId);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
      
      <PaymentTypeSelector
        paymentType={formData.paymentType}
        onPaymentTypeChange={handlePaymentTypeChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formData.paymentType !== "installment" && (
          <BasicExpenseFields
            name={formData.name}
            amount={formData.amount}
            categoryId={formData.categoryId}
            paymentSourceId={formData.paymentSourceId}
            categories={categories}
            paymentSources={paymentSources}
            onInputChange={handleChange}
            onSelectChange={handleSelectChange}
          />
        )}
        
        {formData.paymentType !== "installment" && (
          <DateTimeInputs
            date={formData.date}
            time={formData.time}
            onDateChange={handleDateChange}
            onTimeChange={handleChange}
          />
        )}
      </div>
      
      {formData.paymentType === "installment" && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BasicExpenseFields
              name={formData.name}
              amount=""
              categoryId={formData.categoryId}
              paymentSourceId={formData.paymentSourceId}
              categories={categories}
              paymentSources={paymentSources}
              onInputChange={handleChange}
              onSelectChange={handleSelectChange}
              disableAmount={true}
            />
          </div>
          
          <InstallmentFields
            totalAmount={formData.totalAmount}
            numberOfInstallments={formData.numberOfInstallments}
            startDate={formData.startDate}
            onTotalAmountChange={handleChange}
            onNumberOfInstallmentsChange={handleChange}
            onStartDateChange={handleStartDateChange}
          />
        </div>
      )}
      
      <FormActions isSubmitting={isSubmitting} isEditing={!!editId} />
    </form>
  );
}
