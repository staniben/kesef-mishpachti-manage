
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentSourceForm } from "@/components/PaymentSourceForm";
import { PaymentSource } from "@/types/models";
import { Plus, Edit, Trash, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSources() {
  const { paymentSources, addPaymentSource, updatePaymentSource, deletePaymentSource, fetchPaymentSources } = useAppStore();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<PaymentSource | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payment sources when the component mounts
  useEffect(() => {
    const loadPaymentSources = async () => {
      try {
        setIsLoading(true);
        await fetchPaymentSources();
      } catch (error) {
        console.error("Error loading payment sources:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת אמצעי התשלום",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentSources();
  }, [fetchPaymentSources, toast]);

  // Set up real-time subscription to payment_sources table
  useEffect(() => {
    // Create an async function to get the session
    const setupRealtimeSubscription = async () => {
      try {
        // Properly await and destructure the session data
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          return;
        }
        
        // Only subscribe if we have a valid session and user
        if (!sessionData?.session?.user) {
          return; // No need to subscribe if user is not authenticated
        }
        
        // Subscribe to changes on the payment_sources table
        const channel = supabase
          .channel('payment_sources_channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'payment_sources',
              filter: `user_id=eq.${sessionData.session.user.id}`,
            },
            () => {
              // Refresh data when changes occur
              fetchPaymentSources();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Error setting up realtime subscription:", err);
      }
    };
    
    // Call the async function
    setupRealtimeSubscription();
    
  }, [fetchPaymentSources]);

  const handleAddSource = async (source: PaymentSource) => {
    try {
      setIsLoading(true);
      console.log("Adding payment source:", source);
      await addPaymentSource(source);
      setIsAddDialogOpen(false);
      toast({
        title: "אמצעי תשלום נוסף",
        description: "אמצעי התשלום נוסף בהצלחה",
      });
    } catch (error) {
      console.error("Error adding payment source:", error);
      // Enhanced error reporting
      let errorMessage = "אירעה שגיאה בהוספת אמצעי התשלום";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        // Optionally include specific error message for developers or in dev mode
        if (process.env.NODE_ENV === 'development') {
          errorMessage = `שגיאה: ${error.message}`;
        }
      }
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSource = async (source: PaymentSource) => {
    try {
      setIsLoading(true);
      console.log("Updating payment source:", source);
      await updatePaymentSource(source.id, source);
      setIsEditDialogOpen(false);
      setCurrentSource(undefined);
      toast({
        title: "אמצעי תשלום עודכן",
        description: "פרטי אמצעי התשלום עודכנו בהצלחה",
      });
    } catch (error) {
      console.error("Error updating payment source:", error);
      // Enhanced error reporting
      let errorMessage = "אירעה שגיאה בעדכון אמצעי התשלום";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        // Optionally include specific error message for developers or in dev mode
        if (process.env.NODE_ENV === 'development') {
          errorMessage = `שגיאה: ${error.message}`;
        }
      }
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (source: PaymentSource) => {
    setCurrentSource(source);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (source: PaymentSource) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את אמצעי התשלום "${source.name}"?`)) {
      try {
        setIsLoading(true);
        console.log("Deleting payment source:", source.id);
        await deletePaymentSource(source.id);
        toast({
          title: "אמצעי תשלום נמחק",
          description: "אמצעי התשלום נמחק בהצלחה",
        });
      } catch (error) {
        console.error("Error deleting payment source:", error);
        toast({
          title: "שגיאה",
          description: error instanceof Error ? error.message : "אירעה שגיאה במחיקת אמצעי התשלום",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <Wallet className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSourceTypeName = (type: string) => {
    switch (type) {
      case 'credit':
        return "כרטיס אשראי";
      case 'cash':
        return "מזומן";
      case 'bank':
        return "העברה בנקאית";
      case 'other':
        return "אחר";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">אמצעי תשלום</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף אמצעי תשלום
        </Button>
      </div>

      {isLoading && <div className="text-center py-4">טוען אמצעי תשלום...</div>}

      {!isLoading && paymentSources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>לא נמצאו אמצעי תשלום</p>
          <p>לחץ על "הוסף אמצעי תשלום" כדי להתחיל</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {paymentSources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: source.color || "#2196F3" }}
                  />
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {getSourceIcon(source.type)}
                      {getSourceTypeName(source.type)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(source)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(source)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Add Source Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>הוספת אמצעי תשלום</DialogTitle>
          </DialogHeader>
          <PaymentSourceForm
            onSave={handleAddSource}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת אמצעי תשלום</DialogTitle>
          </DialogHeader>
          {currentSource && (
            <PaymentSourceForm
              source={currentSource}
              onSave={handleUpdateSource}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentSource(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
