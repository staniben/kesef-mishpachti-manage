
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
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { ChartPie, CreditCard, Plus, Settings, X } from "lucide-react";
import { useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { calculateTotalExpenses } from "@/utils/expenseUtils";

export function AppSidebar() {
  const { expenses, categories, paymentSources } = useAppStore();
  const { openMobile, setOpenMobile, isMobile, open, setOpen } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the sidebar to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Close mobile sidebar when it's open
        if (isMobile && openMobile) {
          setOpenMobile(false);
        }
        // Close desktop sidebar when it's open (only in floating/offcanvas mode)
        else if (!isMobile && open) {
          setOpen(false);
        }
      }
    }

    // Only add the event listener when the sidebar is open
    if ((isMobile && openMobile) || (!isMobile && open)) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, openMobile, open, setOpenMobile, setOpen]);

  // Handle menu item click to close the sidebar
  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

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

  const totalExpenses = calculateTotalExpenses(expenses);

  return (
    <Sidebar variant="floating" collapsible="offcanvas" ref={sidebarRef}>
      <SidebarHeader className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">ניהול תקציב</h2>
        <SidebarTrigger className="h-8 w-8">
          <X className="h-5 w-5" />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className="flex items-center gap-2"
                      onClick={handleMenuItemClick}
                    >
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
                <span className="font-semibold">סה"כ הוצאות:</span> {totalExpenses.toLocaleString()} ₪
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
