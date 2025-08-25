import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Navigation from "@/components/Navigation";
import MessageHistoryPage from "@/components/MessageHistory";
import FavoritesPage from "@/components/FavoritesPage";

function Router({ darkMode, onToggleDarkMode }: { darkMode: boolean; onToggleDarkMode: () => void }) {
  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <Navigation darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
      <main className="main-content">
        <Switch>
          <Route path="/" component={Home}/>
          <Route path="/history" component={MessageHistoryPage}/>
          <Route path="/favorites" component={FavoritesPage}/>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
