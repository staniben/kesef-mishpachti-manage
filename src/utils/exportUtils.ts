
import * as XLSX from 'xlsx';
import { Expense } from '@/types/models';

interface ExportData {
  date: string;
  category: string;
  name: string;
  amount: string;
  paymentSource: string;
  paymentType: string;
}

export const exportToExcel = (
  expenses: Expense[],
  categoryMap: Record<string, string>,
  paymentSourceMap: Record<string, string>,
  month: number,
  year: number
): void => {
  if (expenses.length === 0) {
    return;
  }

  // Format data for Excel
  const data: ExportData[] = expenses.map(expense => {
    let paymentType = 'חד פעמי';
    
    if (expense.isInstallment && expense.installmentNumber && expense.totalInstallments) {
      paymentType = `תשלום ${expense.installmentNumber} מתוך ${expense.totalInstallments}`;
    } else if (expense.isRecurring) {
      paymentType = 'תשלום קבוע';
    }

    return {
      date: new Date(expense.date).toLocaleDateString('he-IL'),
      category: categoryMap[expense.categoryId] || 'לא מוגדר',
      name: expense.name,
      amount: `₪ ${expense.amount.toLocaleString()}`,
      paymentSource: paymentSourceMap[expense.paymentSourceId] || 'לא מוגדר',
      paymentType,
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set RTL direction and column headers in Hebrew
  const headers = [
    'תאריך',
    'קטגוריה',
    'שם',
    'סכום',
    'אמצעי תשלום',
    'סוג'
  ];
  
  // Set column widths
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // Category
    { wch: 25 }, // Description
    { wch: 12 }, // Amount
    { wch: 15 }, // Payment Source
    { wch: 20 }, // Payment Type
  ];
  
  worksheet['!cols'] = colWidths;
  
  // Replace default headers with Hebrew headers
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'הוצאות');
  
  // Get month name in Hebrew
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 
    'מאי', 'יוני', 'יולי', 'אוגוסט', 
    'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  // Generate filename
  const fileName = `expenses_report_${monthNames[month]}_${year}.xlsx`;
  
  // Write and download file
  XLSX.writeFile(workbook, fileName);
};
