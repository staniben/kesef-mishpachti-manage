
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [stayConnected, setStayConnected] = useState<boolean>(true);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password, stayConnected);
      toast({
        title: "התחברת בהצלחה!",
        description: "ברוך הבא לאפליקציית ניהול ההוצאות",
      });
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "שגיאה בהתחברות",
        description: "אימייל או סיסמה שגויים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password);
      toast({
        title: "נרשמת בהצלחה!",
        description: "ברוכים הבאים לאפליקציית ניהול ההוצאות",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "אירעה שגיאה במהלך ההרשמה";
      
      if (error.message?.includes("already registered")) {
        errorMessage = "כתובת המייל כבר רשומה במערכת";
      }
      
      toast({
        title: "שגיאה בהרשמה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-[350px] md:w-[450px]">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">התחברות</TabsTrigger>
            <TabsTrigger value="register">הרשמה</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSignIn}>
              <CardHeader>
                <CardTitle className="text-xl">התחברות</CardTitle>
                <CardDescription>
                  הזן את פרטי ההתחברות שלך להמשך
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">כתובת מייל</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="mail@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">סיסמה</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="stay-connected" 
                    checked={stayConnected} 
                    onCheckedChange={(checked) => setStayConnected(checked === true)}
                  />
                  <Label 
                    htmlFor="stay-connected" 
                    className="text-sm cursor-pointer"
                  >
                    השאר אותי מחובר
                  </Label>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "מתחבר..." : "התחברות"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardHeader>
                <CardTitle className="text-xl">הרשמה</CardTitle>
                <CardDescription>
                  צור חשבון חדש להתחלת השימוש
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">כתובת מייל</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="mail@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">סיסמה</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "נרשם..." : "הרשמה"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
