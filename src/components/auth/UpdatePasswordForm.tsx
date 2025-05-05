
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UpdatePasswordForm() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      
      // Show success state
      setSuccess(true);
      
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
    <>
      {!success ? (
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
      ) : (
        <div className="p-4 text-center">
          <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-medium mb-2">הסיסמה עודכנה!</h3>
          <p className="text-muted-foreground mb-6">
            הסיסמה שלך עודכנה בהצלחה. כעת ניתן להתחבר עם הסיסמה החדשה.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            חזור לדף הבית
          </Button>
        </div>
      )}
    </>
  );
}
