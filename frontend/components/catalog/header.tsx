'use client'

import Link from 'next/link'
import { Play, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary/10 transition-all duration-300 group-hover:bg-accent-primary/20 group-hover:glow-cyan-sm">
            <Play className="h-5 w-5 fill-accent-primary text-accent-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Anime<span className="text-accent-primary">Vista</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/" 
            className="text-sm font-medium text-foreground-muted transition-colors hover:text-accent-primary"
          >
            Home
          </Link>
          <Link 
            href="/catalog" 
            className="text-sm font-medium text-accent-primary"
          >
            Catalog
          </Link>
          <Link 
            href="#" 
            className="text-sm font-medium text-foreground-muted transition-colors hover:text-accent-primary"
          >
            Top Rated
          </Link>
          <Link 
            href="#" 
            className="text-sm font-medium text-foreground-muted transition-colors hover:text-accent-primary"
          >
            New Releases
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center justify-center rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground-muted transition-all hover:border-accent-primary/50 hover:text-foreground">
            Sign In
          </button>
          <button className="hidden sm:inline-flex items-center justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-secondary hover:glow-cyan-sm">
            Get Started
          </button>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-300 border-t border-border/50 bg-background-secondary",
        mobileMenuOpen ? "max-h-64" : "max-h-0 border-t-0"
      )}>
        <nav className="flex flex-col gap-1 p-4">
          <Link 
            href="/" 
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-accent-primary"
          >
            Home
          </Link>
          <Link 
            href="/catalog" 
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-accent-primary bg-accent-primary/10"
          >
            Catalog
          </Link>
          <Link 
            href="#" 
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-accent-primary"
          >
            Top Rated
          </Link>
          <Link 
            href="#" 
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-accent-primary"
          >
            New Releases
          </Link>
          <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
            <button className="flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground-muted transition-all hover:border-accent-primary/50">
              Sign In
            </button>
            <button className="flex-1 items-center justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-secondary">
              Get Started
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
