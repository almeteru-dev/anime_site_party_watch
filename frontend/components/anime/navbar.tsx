"use client"

import { Search, Menu, Bell, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Anime<span className="text-primary">Vista</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground-muted hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link href="/browse" className="text-foreground-muted hover:text-primary transition-colors font-medium">
              Browse
            </Link>
            <Link href="/schedule" className="text-foreground-muted hover:text-primary transition-colors font-medium">
              Schedule
            </Link>
            <Link href="/genres" className="text-foreground-muted hover:text-primary transition-colors font-medium">
              Genres
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-foreground-subtle hover:text-primary hover:bg-primary/10"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Bookmarks */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-foreground-subtle hover:text-primary hover:bg-primary/10 hidden sm:flex"
            >
              <Bookmark className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-foreground-subtle hover:text-primary hover:bg-primary/10 hidden sm:flex relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>

            {/* Sign In Button */}
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 hidden sm:flex"
            >
              Sign In
            </Button>

            {/* Mobile Menu */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-foreground-subtle hover:text-primary hover:bg-primary/10 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
