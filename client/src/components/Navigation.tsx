import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Home, History, Heart, Moon, Sun } from 'lucide-react';

interface NavigationProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navigation({ darkMode, onToggleDarkMode }: NavigationProps) {
  const [location] = useLocation();

  return (
    <nav className="navigation-bar">
      <div className="navigation-container">
        <div className="navigation-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100" className="navigation-icon">
            <circle cx="50" cy="50" r="44" fill="#009ca6" stroke="#425563" strokeWidth="2"/>
            <circle cx="50" cy="50" r="20" fill="#ffffff" stroke="#425563" strokeWidth="2"/>
            <g fill="#64a70b">
              <path d="M 50,6 A 44,44 0 0,1 81.11,18.89 L 64.14,35.86 A 20,20 0 0,0 50,30 Z"/>
              <path d="M 81.11,81.11 A 44,44 0 0,1 50,94 L 50,70 A 20,20 0 0,0 64.14,64.14 Z"/>
            </g>
            <g fill="#ffffff">
              <path d="M 18.89,81.11 A 44,44 0 0,1 6,50 L 30,50 A 20,20 0 0,0 35.86,64.14 Z"/>
              <path d="M 18.89,18.89 A 44,44 0 0,1 50,6 L 50,30 A 20,20 0 0,0 35.86,35.86 Z"/>
            </g>
            <g stroke="#425563" strokeWidth="2" fill="none">
              <line x1="50" y1="6" x2="50" y2="30"/>
              <line x1="94" y1="50" x2="70" y2="50"/>
              <line x1="50" y1="94" x2="50" y2="70"/>
              <line x1="6" y1="50" x2="30" y2="50"/>
            </g>
            <circle cx="50" cy="50" r="20" fill="none" stroke="#425563" strokeWidth="2"/>
          </svg>
          <span className="navigation-title">SOSGEN</span>
        </div>

        <div className="navigation-links">
          <Link href="/">
            <Button 
              variant={location === '/' ? 'default' : 'ghost'} 
              size="sm"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>
          </Link>
          
          <Link href="/history">
            <Button 
              variant={location === '/history' ? 'default' : 'ghost'} 
              size="sm"
              data-testid="nav-history"
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </Button>
          </Link>
          
          <Link href="/favorites">
            <Button 
              variant={location === '/favorites' ? 'default' : 'ghost'} 
              size="sm"
              data-testid="nav-favorites"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favoritos
            </Button>
          </Link>
        </div>

        <div className="navigation-controls">
          <div className="theme-toggle">
            <Sun className={`theme-icon ${!darkMode ? 'active' : ''}`} />
            <Switch
              checked={darkMode}
              onCheckedChange={onToggleDarkMode}
              data-testid="toggle-dark-mode"
            />
            <Moon className={`theme-icon ${darkMode ? 'active' : ''}`} />
          </div>
        </div>
      </div>
    </nav>
  );
}