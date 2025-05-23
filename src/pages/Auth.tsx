import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RememberMeCheckbox } from "@/components/ui/RememberMeCheckbox";
import { Mail, Check } from "lucide-react";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { parseAuthHashParams, isPasswordResetUrl } from "@/utils/authUtils";

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [persistSession, setPersistSession] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Extract error information from URL hash
  const [errorInfo, setErrorInfo] = useState<{
    error: string | null;
    errorCode: string | null;
    errorDescription: string | null;
  }>({ error: null, errorCode: null, errorDescription: null });

  // Determine if we should show the update password form
  const showUpdatePassword = searchParams.get('type') === 'recovery' || 
    (location.hash && location.hash.includes('type=recovery'));
  
  // Process URL hash for auth data
  useEffect(() => {
    // Check if we're coming from a recovery link
    const hashParams = parseAuthHashParams();
    
    if (hashParams?.type === 'recovery' || hashParams?.accessToken) {
      console.log('Detected recovery flow from hash parameters');
      setActiveTab('update-password');
      
      // Clear the hash after processing to prevent issues on refresh
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } 
    // Process other hash parameters looking for errors
    else if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description')?.replace(/\+/g, ' ');
      
      if (error) {
        setErrorInfo({ error, errorCode, errorDescription });
        // If there's an OTP expired error, show the reset password tab
        if (errorCode === 'otp_expired') {
          setActiveTab('reset');
          toast({
            title: "קישור פג תוקף",
            description: "קישור איפוס הסיסמה פג תוקף. אנא בקש קישור חדש.",
            variant: "destructive",
          });
        }
      }
    }
  }, [location.hash, toast]);
  
  // Set the active tab based on the URL parameters
  useEffect(() => {
    if (searchParams.get('type') === 'recovery') {
      console.log('Detected recovery from search params');
      setActiveTab('update-password');
    }
  }, [searchParams]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }
    
    setLoginLoading(true);
    try {
      console.log(`Attempting login with persistSession=${persistSession}`);
      await signIn(loginEmail, loginPassword, persistSession);
      toast({
        title: "התחברות בוצעה בהצלחה",
        description: "ברוך הבא למערכת",
      });
      
      // After successful login, let's do a quick page reload to ensure
      // the application starts with a fresh state and session
      // This helps avoid issues with stale session state
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "שגיאה בהתחברות",
        description: error instanceof Error ? error.message : "אירעה שגיאה בהתחברות",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerEmail || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "שגיאה",
        description: "סיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }
    
    setRegisterLoading(true);
    try {
      await signUp(registerEmail, registerPassword);
      toast({
        title: "הרשמה בוצעה בהצלחה",
        description: "בדוק את הדואר האלקטרוני שלך להשלמת ההרשמה",
      });
      
      // Clear form
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "שגיאה בהרשמה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בהרשמה",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת דוא״ל",
        variant: "destructive",
      });
      return;
    }
    
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      
      // Show success state
      setResetSuccess(true);
      
      toast({
        title: "הוראות לאיפוס סיסמה נשלחו",
        description: "בדוק את הדואר האלקטרוני שלך להמשך התהליך",
      });
      
      // Clear form and error info after successful request
      setResetEmail("");
      setErrorInfo({ error: null, errorCode: null, errorDescription: null });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "שגיאה באיפוס סיסמה",
        description: error instanceof Error ? error.message : "אירעה שגיאה באיפוס הסיסמה",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">מערכת ניהול הוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          {errorInfo.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>שגיאה באיפוס סיסמה</AlertTitle>
              <AlertDescription>
                {errorInfo.errorDescription || 'קישור לאיפוס הסיסמה אינו תקף או שפג תוקפו. אנא בקש קישור חדש.'}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${showUpdatePassword ? 'grid-cols-1' : 'grid-cols-3'} mb-6`}>
              {!showUpdatePassword ? (
                <>
                  <TabsTrigger value="login">התחברות</TabsTrigger>
                  <TabsTrigger value="register">הרשמה</TabsTrigger>
                  <TabsTrigger value="reset">שחזור סיסמה</TabsTrigger>
                </>
              ) : (
                <TabsTrigger value="update-password">עדכון סיסמה</TabsTrigger>
              )}
            </TabsList>
            
            {!showUpdatePassword ? (
              <>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">דוא״ל</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)} 
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">סיסמה</Label>
                      <Input 
                        id="login-password" 
                        type="password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    
                    <RememberMeCheckbox 
                      checked={persistSession} 
                      onCheckedChange={(checked) => setPersistSession(checked)} 
                      className="my-4"
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginLoading}
                    >
                      {loginLoading ? "מתחבר..." : "התחבר"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">דוא״ל</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)} 
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">סיסמה</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">אימות סיסמה</Label>
                      <Input 
                        id="register-confirm-password" 
                        type="password" 
                        value={registerConfirmPassword} 
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerLoading}
                    >
                      {registerLoading ? "נרשם..." : "הרשם"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="reset">
                  {!resetSuccess ? (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="text-center mb-6">
                        <Mail className="mx-auto h-12 w-12 text-primary" />
                        <h3 className="mt-2 text-lg font-medium">שכחת את הסיסמה?</h3>
                        <p className="text-sm text-muted-foreground">
                          הזן את כתובת הדוא״ל שלך ונשלח לך הוראות לאיפוס הסיסמה
                        </p>
                        {errorInfo.errorCode === 'otp_expired' && (
                          <p className="text-sm text-destructive mt-2">
                            הקישור הקודם פג תוקף. אנא בקש קישור חדש.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">דוא״ל</Label>
                        <Input 
                          id="reset-email" 
                          type="email" 
                          value={resetEmail} 
                          onChange={(e) => setResetEmail(e.target.value)} 
                          placeholder="your@email.com"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={resetLoading}
                      >
                        {resetLoading ? "שולח..." : "שלח הוראות לאיפוס סיסמה"}
                      </Button>
                    </form>
                  ) : (
                    <div className="p-4 text-center">
                      <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">הוראות נשלחו!</h3>
                      <p className="text-muted-foreground mb-6">
                        הוראות לאיפוס הסיסמה נשלחו לדוא״ל שלך. אנא בדוק את תיבת הדואר הנכנס.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetSuccess(false);
                          setActiveTab("login");
                        }}
                        className="w-full"
                      >
                        חזור להתחברות
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </>
            ) : (
              <TabsContent value="update-password">
                <UpdatePasswordForm />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
