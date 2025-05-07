
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AuthRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { StoreInitializer } from "./components/store/StoreInitializer";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Categories from "./pages/Categories";
import PaymentSources from "./pages/PaymentSources";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes (redirect to home if logged in) */}
            <Route element={<AuthRoute />}>
              <Route path="/auth" element={<Auth />} />
            </Route>
            
            {/* Protected routes (redirect to login if not logged in) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/edit-expense/:id" element={<EditExpense />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/payment-sources" element={<PaymentSources />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
