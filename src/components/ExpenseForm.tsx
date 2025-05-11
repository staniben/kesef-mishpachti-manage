import React from "react";
import { BasicExpenseFields } from "./expense/BasicExpenseFields";
import { DateTimeInputs } from "./expense/DateTimeInputs";
import { FormActions } from "./expense/FormActions";
import { PaymentTypeSelector } from "./expense/PaymentTypeSelector";
import { InstallmentFields } from "./expense/InstallmentFields";
import { RecurringFields } from "./expense/RecurringFields";
import { useExpenseForm } from "@/hooks/useExpenseForm";
import { PaymentType } from "@/types";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  editId?: string;
  initialData?: {
    paymentType?: PaymentType;
    name?: string;
    amount?: string;
    categoryId?: string;
    paymentSourceId?: string;
    totalAmount?: string;
    numberOfInstallments?: string;
  };
}

export function ExpenseForm({ editId, initialData }: ExpenseFormProps) {
  const {
    formData,
    isSubmitting,
    isLoadingData,
    isDataMissing,
    categories,
    paymentSources,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleStartDateChange,
    handlePaymentTypeChange,
    handleSubmit
  } = useExpenseForm(editId, initialData);
  
  // Show loading state when initializing data
  if (isLoadingData) {
    return (
      <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }
  
  // Show placeholder state when data is missing (categories or payment sources)
  if (isDataMissing) {
    return (
      <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
        <div className="border border-dashed border-muted-foreground/50 p-6 rounded-md bg-muted/20">
          <div className="text-center space-y-2">
            <p className="font-medium">לא ניתן להציג את הטופס</p>
            <p className="text-sm text-muted-foreground">
              {categories.length === 0 ? 'נדרשות קטגוריות ' : ''}
              {categories.length === 0 && paymentSources.length === 0 ? 'ו' : ''}
              {paymentSources.length === 0 ? 'נדרשים אמצעי תשלום ' : ''}
              כדי להוסיף הוצאה
            </p>
            <div className="pt-4">
              <a 
                href="/categories" 
                className="text-sm text-primary hover:underline mx-2"
              >
                הוסף קטגוריות
              </a>
              <a 
                href="/payment-sources" 
                className="text-sm text-primary hover:underline mx-2"
              >
                הוסף אמצעי תשלום
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
      
      <PaymentTypeSelector
        paymentType={formData.paymentType}
        onPaymentTypeChange={handlePaymentTypeChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formData.paymentType === "one-time" && (
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
        
        {formData.paymentType === "one-time" && (
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
      
      {formData.paymentType === "recurring" && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
          
          <RecurringFields
            startDate={formData.startDate}
            onStartDateChange={handleStartDateChange}
          />
        </div>
      )}
      
      <FormActions isSubmitting={isSubmitting} isEditing={!!editId} />
    </form>
  );
}
