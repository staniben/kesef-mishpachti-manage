
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "התנתקת בהצלחה",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "שגיאה בהתנתקות",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{user?.email}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        התנתקות
      </Button>
    </div>
  );
}
