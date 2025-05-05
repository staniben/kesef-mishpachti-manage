
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export function UpdatePasswordForm() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await updatePassword(newPassword);
      toast({
        title: "הצלחה",
        description: "סיסמתך שונתה בהצלחה",
      });
      
      // Clear form
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "שגיאה בעדכון הסיסמה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בעדכון הסיסמה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <div className="text-center mb-6">
        <Lock className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-2 text-lg font-medium">עדכון סיסמה</h3>
        <p className="text-sm text-muted-foreground">
          יש להזין סיסמה חדשה
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">סיסמה חדשה</Label>
        <Input 
          id="new-password" 
          type="password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">אימות סיסמה</Label>
        <Input 
          id="confirm-password" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
      >
        {loading ? "מעדכן..." : "עדכן סיסמה"}
      </Button>
    </form>
  );
}
