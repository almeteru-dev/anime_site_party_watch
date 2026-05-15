"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Lock, Eye, EyeOff, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useAuth } from "@/contexts/auth-context"
import { getPublicSettings } from "@/lib/api"

const API_URL = "/api"

export default function LoginPage() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
	const [registrationDisabled, setRegistrationDisabled] = useState<boolean | null>(null)

  useEffect(() => {
    const msg = sessionStorage.getItem("force_logout_message")
    if (msg) {
      setError(msg)
      sessionStorage.removeItem("force_logout_message")
    }
  }, [])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				setRegistrationDisabled(s.registration_disabled)
			} catch {
				;
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: formData.identifier, password: formData.password, remember_me: rememberMe }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      login(data.user, rememberMe)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background gradient - top-center glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0, 229, 255, 0.05) 0%, transparent 50%)",
        }}
      />
      
      {/* Decorative watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25rem] font-bold text-secondary/[0.02] select-none pointer-events-none leading-none tracking-tighter">
        LL
      </div>

      {/* Scan-line animation overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline-line) 2px, var(--scanline-line) 4px)",
          animation: "scanline 8s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors duration-300 group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">{t.login.backToHome}</span>
      </Link>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/40 via-transparent to-transparent rounded-2xl pointer-events-none" />
        
        <div className="relative backdrop-blur-xl rounded-2xl p-8 sm:p-10 bg-background-secondary/80 border border-border/60 shadow-[var(--card-shadow)]">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                  <img src="/favicon.svg" alt="LycorisLib" className="w-8 h-8" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-foreground">Lycoris</span>
                <span className="text-primary">Lib</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.login.welcomeBack}</h1>
            <p className="text-foreground-muted text-sm">{t.login.signInContinue}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username/Email Field */}
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-medium text-foreground-muted">
                {t.login.usernameOrEmail}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className={`w-5 h-5 transition-colors duration-300 ${focusedField === "identifier" ? "text-primary" : "text-foreground-subtle"}`} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange("identifier", e.target.value)}
                  onFocus={() => setFocusedField("identifier")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.login.enterUsernameOrEmail}
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
                {t.login.password}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors duration-300 ${focusedField === "password" ? "text-primary" : "text-foreground-subtle"}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.login.enterPassword}
                  className="w-full h-12 pl-12 pr-12 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-primary transition-colors duration-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    rememberMe 
                      ? "bg-primary border-primary" 
                      : "border-border/70 hover:border-primary/50"
                  }`}
                  aria-label={t.login.rememberMe}
                >
                  {rememberMe && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </button>
                <label 
                  className="text-sm text-foreground-muted cursor-pointer select-none" 
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {t.login.rememberMe}
                </label>
              </div>
              <Link 
                href="/forgot-password?from=login" 
                className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-300"
              >
                {t.login.forgotPassword}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[var(--glow-primary)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t.login.signingIn}</span>
                </>
              ) : (
                t.login.loginButton
              )}
            </button>
          </form>

          {/* Register Link */}
          {registrationDisabled !== true ? (
            <p className="text-center mt-8 text-foreground-muted text-sm">
              {t.login.newToLycorisLib}{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary/80 hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"
              >
                {t.login.joinNow}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
