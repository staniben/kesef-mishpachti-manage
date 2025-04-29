
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { ChartPie, CreditCard, Plus, Settings, Cash } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export function AppSidebar() {
  const { expenses, categories, paymentSources } = useAppContext();

  const menuItems = [
    {
      title: "דשבורד",
      url: "/",
      icon: ChartPie,
    },
    {
      title: "הוסף הוצאה",
      url: "/add-expense",
      icon: Plus,
    },
    {
      title: "קטגוריות",
      url: "/categories",
      icon: Category,
    },
    {
      title: "אמצעי תשלום",
      url: "/payment-sources",
      icon: CreditCard,
    },
    {
      title: "הגדרות",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-bold">ניהול תקציב</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>סטטיסטיקה</SidebarGroupLabel>
          <SidebarGroupContent className="p-3">
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-semibold">סה"כ הוצאות:</span> {expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()} ₪
              </div>
              <div className="mb-2">
                <span className="font-semibold">קטגוריות:</span> {categories.length}
              </div>
              <div>
                <span className="font-semibold">אמצעי תשלום:</span> {paymentSources.length}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 text-xs text-center">
        ניהול תקציב משפחתי | גרסה 1.0
      </SidebarFooter>
    </Sidebar>
  );
}

// Custom Category icon component for RTL
function Category(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
