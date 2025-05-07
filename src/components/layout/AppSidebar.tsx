import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { LayoutDashboard, PlusCircle, Settings, Tags, Wallet } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { GroupedList } from "./GroupedList";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/components/UserProfile";
import { useMobile } from "@/hooks/use-mobile";
import { calculateTotalExpenses, filterExpensesByMonth } from "@/utils/expense";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "לוח בקרה",
    href: "/",
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: "הוספת הוצאה",
    href: "/add-expense",
    icon: <PlusCircle size={20} />,
  },
  {
    title: "קטגוריות",
    href: "/categories",
    icon: <Tags size={20} />,
  },
  {
    title: "אמצעי תשלום",
    href: "/payment-sources",
    icon: <Wallet size={20} />,
  },
  {
    title: "הגדרות",
    href: "/settings",
    icon: <Settings size={20} />,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { expenses, categories } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const isMobile = useMobile();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = filterExpensesByMonth(expenses, currentMonth, currentYear);
  const totalExpenses = calculateTotalExpenses(monthlyExpenses);
  
  const groupedExpenses = React.useMemo(() => {
    const grouped = categories.map((category) => {
      const categoryExpenses = monthlyExpenses.filter(
        (expense) => expense.categoryId === category.id
      );
      const categoryTotal = categoryExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      return {
        id: category.id,
        label: category.name,
        value: categoryTotal,
        color: category.color,
      };
    });
    
    // Sort by value in descending order
    grouped.sort((a, b) => b.value - a.value);
    
    return grouped;
  }, [monthlyExpenses, categories]);
  
  return (
    <Sidebar className="w-60">
      <div className="flex flex-col h-full">
        <div className="px-4 py-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">MoneyWise</span>
          </Link>
        </div>
        
        <Separator />
        
        <div className="flex-grow p-4">
          <GroupedList
            title="ניווט"
            items={navItems.map((item) => ({
              ...item,
              active: location.pathname === item.href,
              onClick: () => {},
            }))}
            renderItem={(item) => (
              <Link to={item.href} className="w-full">
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-start",
                    item.active && "bg-secondary/50"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Button>
              </Link>
            )}
          />
          
          <Separator className="my-4" />
          
          <GroupedList
            title="הוצאות החודש"
            items={groupedExpenses.map((item) => ({
              ...item,
              label: `${item.label} - ${item.value.toFixed(2)} ₪`,
            }))}
            renderItem={(item) => (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{item.label}</span>
                <Badge variant="secondary">{item.value.toFixed(2)}</Badge>
              </div>
            )}
          />
        </div>
        
        <Separator />
        
        <div className="p-4 space-y-2">
          <UserProfile user={user} onSignOut={signOut} />
          <ThemeToggle />
        </div>
      </div>
    </Sidebar>
  );
}
