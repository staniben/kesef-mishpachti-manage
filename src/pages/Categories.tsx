
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "@/components/CategoryForm";
import { ExpenseCategory } from "@/types";
import { Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | undefined>();

  const handleAddCategory = (category: ExpenseCategory) => {
    addCategory(category);
    setIsAddDialogOpen(false);
    toast({
      title: "קטגוריה נוספה",
      description: "הקטגוריה נוספה בהצלחה",
    });
  };

  const handleUpdateCategory = (category: ExpenseCategory) => {
    updateCategory(category.id, category);
    setIsEditDialogOpen(false);
    setCurrentCategory(undefined);
    toast({
      title: "קטגוריה עודכנה",
      description: "פרטי הקטגוריה עודכנו בהצלחה",
    });
  };

  const handleEditClick = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (category: ExpenseCategory) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
      deleteCategory(category.id);
      toast({
        title: "קטגוריה נמחקה",
        description: "הקטגוריה נמחקה בהצלחה",
      });
    }
  };

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
        {categories.map((category) => (
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
        ))}
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
