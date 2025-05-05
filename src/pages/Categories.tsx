
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "@/components/CategoryForm";
import { ExpenseCategory } from "@/types/models";
import { Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Categories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error("Authentication error:", authError);
        toast({
          title: "שגיאה",
          description: "יש להתחבר מחדש למערכת",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Fetch categories for the current user
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', authData.user.id);

      if (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הקטגוריות",
          variant: "destructive",
        });
        return;
      }

      // Map the database results to our model format
      const mappedCategories = data.map((item: any): ExpenseCategory => ({
        id: item.id,
        name: item.name,
        color: item.color || "#4CAF50",
        user_id: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setCategories(mappedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הקטגוריות",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (category: ExpenseCategory) => {
    try {
      // Prepare the category data for Supabase (snake_case)
      const dbCategory = {
        id: category.id,
        name: category.name,
        color: category.color,
        user_id: category.user_id,
        created_at: category.createdAt,
        updated_at: category.updatedAt
      };
      
      const { error } = await supabase
        .from('categories')
        .insert(dbCategory);

      if (error) {
        console.error("Error adding category:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהוספת הקטגוריה",
          variant: "destructive",
        });
        throw error;
      }
      
      setIsAddDialogOpen(false);
      await fetchCategories(); // Re-fetch categories
      
      toast({
        title: "קטגוריה נוספה",
        description: "הקטגוריה נוספה בהצלחה",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const handleUpdateCategory = async (category: ExpenseCategory) => {
    try {
      // Prepare the category data for Supabase (snake_case)
      const dbCategory = {
        name: category.name,
        color: category.color,
        updated_at: category.updatedAt
      };
      
      const { error } = await supabase
        .from('categories')
        .update(dbCategory)
        .eq('id', category.id)
        .eq('user_id', category.user_id);

      if (error) {
        console.error("Error updating category:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון הקטגוריה",
          variant: "destructive",
        });
        throw error;
      }
      
      setIsEditDialogOpen(false);
      setCurrentCategory(undefined);
      await fetchCategories(); // Re-fetch categories
      
      toast({
        title: "קטגוריה עודכנה",
        description: "פרטי הקטגוריה עודכנו בהצלחה",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  const handleEditClick = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (category: ExpenseCategory) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)
          .eq('user_id', category.user_id);

        if (error) {
          console.error("Error deleting category:", error);
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה במחיקת הקטגוריה",
            variant: "destructive",
          });
          throw error;
        }
        
        await fetchCategories(); // Re-fetch categories
        
        toast({
          title: "קטגוריה נמחקה",
          description: "הקטגוריה נמחקה בהצלחה",
        });
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">קטגוריות</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף קטגוריה
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-500">
            אין קטגוריות. לחץ על "הוסף קטגוריה" ליצירת קטגוריה חדשה.
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEditClick(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(category)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>הוספת קטגוריה</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSave={handleAddCategory}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת קטגוריה</DialogTitle>
          </DialogHeader>
          {currentCategory && (
            <CategoryForm
              category={currentCategory}
              onSave={handleUpdateCategory}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentCategory(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
