
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "@/components/CategoryForm";
import { ExpenseCategory } from "@/types/models";
import { Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { Loader2 } from "lucide-react";

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, fetchCategories } = useAppStore();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        await fetchCategories();
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הקטגוריות",
          variant: "destructive",
        });
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [fetchCategories, toast]);

  const handleAddCategory = async (category: ExpenseCategory) => {
    try {
      await addCategory(category);
      setIsAddDialogOpen(false);
      toast({
        title: "קטגוריה נוספה",
        description: "הקטגוריה נוספה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הקטגוריה",
        variant: "destructive",
      });
      console.error("Error adding category:", error);
      throw error; // Rethrow to be caught by the form
    }
  };

  const handleUpdateCategory = async (category: ExpenseCategory) => {
    try {
      await updateCategory(category.id, category);
      setIsEditDialogOpen(false);
      setCurrentCategory(undefined);
      toast({
        title: "קטגוריה עודכנה",
        description: "פרטי הקטגוריה עודכנו בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הקטגוריה",
        variant: "destructive",
      });
      console.error("Error updating category:", error);
      throw error; // Rethrow to be caught by the form
    }
  };

  const handleEditClick = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (category: ExpenseCategory) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
        toast({
          title: "קטגוריה נמחקה",
          description: "הקטגוריה נמחקה בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: error instanceof Error ? error.message : "אירעה שגיאה במחיקת הקטגוריה",
          variant: "destructive",
        });
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
