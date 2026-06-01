import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'th';

export const translations = {
  en: {
    dashboard: "Dashboard",
    expenseSummary: "Expense Summary",
    welcomeTitle: "Welcome back to your dashboard",
    welcomeSubtitle: "Analyze your monthly outflow by category",
    newTransaction: "New Transaction",
    searchItems: "Search items...",
    premiumUser: "Premium User",
    reportPeriod: "Report Period:",
    allMonths: "All Months",
    totalBalance: "Total Balance",
    monthlyIncome: "Monthly Income",
    monthlyExpenses: "Monthly Expenses",
    incomeVsExpense: "Income vs. Expense",
    expenseByCategory: "Expense by Category",
    recentTransactions: "Recent Transactions",
    itemDescription: "Item/Description",
    type: "Type",
    category: "Category",
    amount: "Amount",
    date: "Date",
    contribution: "Contribution",
    income: "Income",
    expense: "Expense",
    overview: "Overview",
    outflowsFor: "Outflows for",
    month: "Month",
    period: "Period",
    noExpenseRecords: "No Expense Records Found",
    noExpenseRecordsDesc: "No transaction records logged in {period}. Click the \"+ New Transaction\" button above to log spends.",
    transactionCount: "transaction",
    transactionsCount: "transactions",
    outflowShare: "Outflow share",
    viewDetails: "View Details",
    categoryDetails: "Category Details",
    totalOutflowInCategory: "Total Outflow in Category",
    searchInCategory: "Search in {category}...",
    noTransactionsFoundSearch: "No transactions found matching search.",
    closeInspector: "Close Inspector",
    
    // Modal Form
    cancel: "Cancel",
    addTransactionBtn: "Add Transaction",
    fieldRequired: "This field is required",
    enterAmount: "Enter amount",
    selectCategory: "Select category",
    selectDescription: "Select description",
    typeCustomDescription: "Type custom description...",
    datePickerPlaceholder: "Select date",
    formCategory: "Category",
    formAmount: "Amount",
    formDate: "Date",
    formDescription: "Description / Item",
    customDescriptionToggle: "Toggle custom description typing",

    // Months
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    
    // Categories
    'Food & Dining': "Food & Dining",
    'Shopping': "Shopping",
    'Transportation': "Transportation",
    'Entertainment': "Entertainment",
    'Bills & Utilities': "Bills & Utilities",
    'Other Expenses': "Other Expenses",
    'Sales Revenue': "Sales Revenue"
  },
  th: {
    dashboard: "แดชบอร์ด",
    expenseSummary: "สรุปรายจ่าย",
    welcomeTitle: "ยินดีต้อนรับกลับสู่แดชบอร์ดของคุณ",
    welcomeSubtitle: "วิเคราะห์กระแสเงินสดรายเดือนของคุณตามหมวดหมู่",
    newTransaction: "เพิ่มรายการใหม่",
    searchItems: "ค้นหารายการ...",
    premiumUser: "ผู้ใช้งานพรีเมียม",
    reportPeriod: "รอบการรายงาน:",
    allMonths: "ทุกเดือน",
    totalBalance: "ยอดคงเหลือทั้งหมด",
    monthlyIncome: "รายรับรายเดือน",
    monthlyExpenses: "รายจ่ายรายเดือน",
    incomeVsExpense: "รายรับเทียบกับรายจ่าย",
    expenseByCategory: "รายจ่ายตามหมวดหมู่",
    recentTransactions: "รายการล่าสุด",
    itemDescription: "รายการ / คำอธิบาย",
    type: "ประเภท",
    category: "หมวดหมู่",
    amount: "จำนวนเงิน",
    date: "วันที่",
    contribution: "สัดส่วน",
    income: "รายรับ",
    expense: "รายจ่าย",
    overview: "ภาพรวม",
    outflowsFor: "ยอดจ่ายสำหรับ",
    month: "เดือน",
    period: "รอบเวลา",
    noExpenseRecords: "ไม่พบข้อมูลรายจ่าย",
    noExpenseRecordsDesc: "ไม่มีประวัติการบันทึกรายการใน {period} คลิกที่ปุ่ม \"+ เพิ่มรายการใหม่\" ด้านบนเพื่อบันทึก",
    transactionCount: "รายการ",
    transactionsCount: "รายการ",
    outflowShare: "สัดส่วนรายจ่าย",
    viewDetails: "ดูรายละเอียด",
    categoryDetails: "รายละเอียดหมวดหมู่",
    totalOutflowInCategory: "ยอดรวมรายจ่ายในหมวดหมู่",
    searchInCategory: "ค้นหาในหมวดหมู่ {category}...",
    noTransactionsFoundSearch: "ไม่พบรายการที่ตรงกับการค้นหา",
    closeInspector: "ปิดตัวตรวจสอบ",

    // Modal Form
    cancel: "ยกเลิก",
    addTransactionBtn: "บันทึกรายการ",
    fieldRequired: "กรุณากรอกข้อมูลในช่องนี้",
    enterAmount: "กรอกจำนวนเงิน",
    selectCategory: "เลือกหมวดหมู่",
    selectDescription: "เลือกคำอธิบาย",
    typeCustomDescription: "พิมพ์คำอธิบายเอง...",
    datePickerPlaceholder: "เลือกวันที่",
    formCategory: "หมวดหมู่",
    formAmount: "จำนวนเงิน",
    formDate: "วันที่",
    formDescription: "คำอธิบาย / รายการ",
    customDescriptionToggle: "สลับเป็นพิมพ์คำอธิบายเอง",

    // Months
    january: "มกราคม",
    february: "กุมภาพันธ์",
    march: "มีนาคม",
    april: "เมษายน",
    may: "พฤษภาคม",
    june: "มิถุนายน",
    july: "กรกฎาคม",
    august: "สิงหาคม",
    september: "กันยายน",
    october: "ตุลาคม",
    november: "พฤศจิกายน",
    december: "ธันวาคม",

    // Categories
    'Food & Dining': "อาหารและเครื่องดื่ม",
    'Shopping': "ช้อปปิ้ง",
    'Transportation': "การเดินทาง",
    'Entertainment': "ความบันเทิง",
    'Bills & Utilities': "บิลและสาธารณูปโภค",
    'Other Expenses': "รายจ่ายอื่นๆ",
    'Sales Revenue': "รายได้จากการขาย"
  }
};

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof translations.en;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      get t() {
        return translations[get().language];
      }
    }),
    {
      name: 'pos-language-storage',
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Helper hook to get translations reactively inside components
export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = translations[language];

  return { language, setLanguage, t };
};
