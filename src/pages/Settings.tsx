
import { useState } from "react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ThemeType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { theme, setTheme, financialMonthStartDay, setFinancialMonthStartDay } = useAppStore(state => ({
    theme: state.theme,
    setTheme: state.setTheme,
    financialMonthStartDay: state.financialMonthStartDay,
    setFinancialMonthStartDay: state.setFinancialMonthStartDay
  }));
  const { toast } = useToast();
  const [startDayInput, setStartDayInput] = useState(financialMonthStartDay.toString());

  const handleThemeChange = (value: ThemeType) => {
    setTheme(value);
    toast({
      title: "ערכת נושא שונתה",
      description: "ערכת הנושא שונתה בהצלחה",
    });
  };

  const handleFinancialMonthChange = () => {
    const day = parseInt(startDayInput, 10);
    
    // Validate input
    if (isNaN(day) || day < 1 || day > 31) {
      toast({
        title: "שגיאה",
        description: "יום תחילת חודש פיננסי חייב להיות מספר בין 1 ל-31",
        variant: "destructive",
      });
      // Reset input to current value
      setStartDayInput(financialMonthStartDay.toString());
      return;
    }
    
    setFinancialMonthStartDay(day);
    toast({
      title: "הגדרות חודש פיננסי שונו",
      description: `יום תחילת חודש פיננסי עודכן ל-${day}`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">הגדרות</h1>

      <Card>
        <CardHeader>
          <CardTitle>חודש פיננסי</CardTitle>
          <CardDescription>הגדר באיזה יום בחודש מתחיל החודש הפיננסי</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <p className="mb-2">
                כאשר יום בחודש נמוך מיום תחילת החודש הפיננסי, הוא ישויך לחודש הקודם.
                לדוגמה, אם יום תחילת החודש הפיננסי הוא 11, אז הוצאות מה-1 עד ה-10 במאי ישויכו לאפריל,
                והוצאות מה-11 במאי עד ה-10 ביוני ישויכו למאי.
              </p>
            </div>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="financial-month-start">יום תחילת חודש פיננסי</Label>
                <Input 
                  id="financial-month-start"
                  type="number" 
                  min="1" 
                  max="31" 
                  value={startDayInput}
                  onChange={(e) => setStartDayInput(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button onClick={handleFinancialMonthChange}>שמור</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>ערכת נושא</CardTitle>
          <CardDescription>בחר את ערכת הנושא המועדפת עליך</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={theme} 
            onValueChange={(value) => handleThemeChange(value as ThemeType)}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="default" id="theme-default" />
                <Label htmlFor="theme-default">ברירת מחדל (טורקיז)</Label>
              </div>
              <div className="mt-2 h-20 rounded-md border" style={{ background: "linear-gradient(to bottom right, hsl(180 60% 40%), hsl(180 60% 30%))" }}></div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="purple" id="theme-purple" />
                <Label htmlFor="theme-purple">סגול</Label>
              </div>
              <div className="mt-2 h-20 rounded-md border" style={{ background: "linear-gradient(to bottom right, hsl(270 50% 50%), hsl(270 50% 40%))" }}></div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="blue" id="theme-blue" />
                <Label htmlFor="theme-blue">כחול</Label>
              </div>
              <div className="mt-2 h-20 rounded-md border" style={{ background: "linear-gradient(to bottom right, hsl(210 70% 50%), hsl(210 70% 40%))" }}></div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="green" id="theme-green" />
                <Label htmlFor="theme-green">ירוק</Label>
              </div>
              <div className="mt-2 h-20 rounded-md border" style={{ background: "linear-gradient(to bottom right, hsl(140 50% 40%), hsl(140 50% 30%))" }}></div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>אודות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>מערכת לניהול תקציב משפחתי</p>
            <p>גרסה: 1.0</p>
            <p>פותח באמצעות React, TypeScript, וTailwind CSS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
