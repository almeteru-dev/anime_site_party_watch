"use client"

import { useState, useEffect } from "react"
import { Menu, User, LogOut, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { NavbarAnimeSearch } from "@/components/navbar-anime-search"
import { getRandomAnimeUrl } from "@/lib/api"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isRandomLoading, setIsRandomLoading] = useState(false)
  const { user, logout } = useAuth()
  const isLoggedIn = !!user
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

	const navLinks = [
		{ label: t.nav.catalog, href: "/catalog" },
		{ label: `${t.nav.top100} 100`, href: "/top" },
		{ label: t.nav.schedule, href: "/schedule" },
		...(isLoggedIn ? [{ label: t.nav.watchParty, href: "/watch-party/new" }] : []),
	]

	const goRandom = async () => {
		if (isRandomLoading) return
		setIsRandomLoading(true)
		try {
			const url = await getRandomAnimeUrl()
			if (url) router.push(`/anime/${encodeURIComponent(url)}`)
		} finally {
			setIsRandomLoading(false)
		}
	}

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
		isMobileMenuOpen
			? "bg-background border-b border-border"
			: isScrolled
				? "bg-background/90 backdrop-blur-xl border-b border-border"
				: "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 py-3 md:py-4 lg:py-0 lg:flex-nowrap lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 order-1">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                <img src="/favicon.svg" alt="LycorisLib" className="w-6 h-6" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl lg:text-2xl font-bold tracking-tight">
              <span className="text-foreground">Lycoris</span>
              <span className="text-primary">Lib</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex order-3 w-full items-center justify-center lg:order-2 lg:w-auto lg:flex-1 lg:min-w-0">
            <div className="flex items-center gap-6 lg:gap-8 whitespace-nowrap">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-foreground-muted hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={goRandom}
                disabled={isRandomLoading}
                className={cn(
                  "text-foreground-muted hover:text-primary transition-colors duration-200 font-medium",
                  isRandomLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {t.nav.random}
              </button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0 order-2 ml-auto lg:order-3">
            <NavbarAnimeSearch />

            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* User Profile / Sign In - Desktop */}
            {isLoggedIn ? (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{user?.username}</span>
                </button>
                
                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileMenuOpen(false)} 
                    />
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 bg-background-secondary/95 backdrop-blur-xl border border-border shadow-lg"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-primary/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.nav.myProfile}</span>
                      </Link>
                      <Link
                        href="/profile/mylist"
                        className="flex items-center gap-3 px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-primary/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.nav.myList}</span>
                      </Link>
                      <Link
                        href="/watch-party/new"
                        className="flex items-center gap-3 px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-primary/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.nav.watchParty}</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setIsProfileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.nav.signOut}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center justify-center px-5 py-2 bg-primary text-primary-foreground font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105"
              >
                {t.nav.signIn}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground-muted">Theme</div>
                <ThemeToggle />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground-muted hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
				<button
					type="button"
					onClick={async () => {
						setIsMobileMenuOpen(false)
						await goRandom()
					}}
					className="text-left text-foreground-muted hover:text-primary transition-colors duration-200 font-medium py-2"
					disabled={isRandomLoading}
				>
					{t.nav.random}
				</button>
              
              {/* Mobile Language Switcher */}
              <div className="border-t border-border pt-4 mt-2">
                <LanguageSwitcher variant="mobile" />
              </div>
              
              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground-muted hover:text-primary transition-colors mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{t.nav.myProfile}</span>
                  </Link>
                  <Link
                    href="/profile/mylist"
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground-muted hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{t.nav.myList}</span>
                  </Link>
                  <Link
                    href="/watch-party/new"
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground-muted hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{t.nav.watchParty}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-foreground-muted hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{t.nav.signOut}</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.nav.signIn}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
