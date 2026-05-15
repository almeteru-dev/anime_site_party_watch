"use client";

import { Calendar } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                <img src="/favicon.svg" alt="LycorisLib" className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                LycorisLib
              </h1>
              <p className="text-xs text-foreground-subtle -mt-0.5">Release Schedule</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">
              Home
            </a>
            <a href="#" className="text-primary text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </a>
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">
              Browse
            </a>
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">
              My List
            </a>
          </nav>

          {/* CTA */}
          <button className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
