
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const toggleTheme = () => {
    const newTheme = theme === 'default' ? 'blue' : 'default';
    setTheme(newTheme);
    
    // Also set the data-theme attribute on the document for Tailwind theme
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'default' ? <Moon size={20} /> : <Sun size={20} />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
