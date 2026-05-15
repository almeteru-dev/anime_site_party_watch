"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Mail, Lock, ShieldCheck, Eye, EyeOff, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useRouter } from "next/navigation"
import { PasswordChecklist } from "@/components/password-checklist"
import { getPublicSettings } from "@/lib/api"

const API_URL = "/api"

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				if (s.registration_disabled) {
					router.replace("/login")
				}
			} catch {
				;
			}
		})()
		return () => {
			mounted = false
		}
	}, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" })
      setError("Passwords do not match")
      return
    }

    // Password validation
    const password = formData.password
    if (password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters long" })
      setError("Password must be at least 8 characters long")
      return
    }
    if (password.length > 100) {
      setFieldErrors({ password: "Password must be at most 100 characters long" })
      setError("Password must be at most 100 characters long")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setFieldErrors({ password: "Password must contain at least one uppercase letter" })
      setError("Password must contain at least one uppercase letter")
      return
    }
    if (!/[0-9]/.test(password)) {
      setFieldErrors({ password: "Password must contain at least one digit" })
      setError("Password must contain at least one digit")
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setFieldErrors({ password: "Password must contain at least one special character" })
      setError("Password must contain at least one special character")
      return
    }
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(password)) {
      setFieldErrors({ password: "Password must only contain English letters, digits, and special characters" })
      setError("Password must only contain English letters, digits, and special characters")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
		   confirm_password: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
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
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 80% 80%, rgba(0, 229, 255, 0.08) 0%, transparent 50%)",
        }}
      />
      
      {/* Decorative watermark */}
      <div className="absolute bottom-0 right-0 text-[20rem] font-bold text-secondary/[0.03] select-none pointer-events-none leading-none tracking-tighter">
        LL
      </div>

      {/* Scan-line overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline-line) 2px, var(--scanline-line) 4px)",
        }}
      />

      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors duration-300 group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">{t.register.backToHome}</span>
      </Link>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Registration Card */}
      <div className="relative w-full max-w-md">
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/50 via-transparent to-transparent rounded-2xl pointer-events-none" />
        
        <div className="relative backdrop-blur-md bg-background-secondary/80 rounded-2xl p-8 sm:p-10 border border-border/60 shadow-[var(--card-shadow)]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                  <img src="/favicon.svg" alt="LycorisLib" className="w-7 h-7" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">Lycoris</span>
                <span className="text-primary">Lib</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.register.joinTheVista}</h1>
            <p className="text-foreground-muted text-sm">{t.register.createAccountStart}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground-muted">
                {t.register.username}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className={`w-5 h-5 transition-colors duration-300 ${focusedField === "username" ? "text-primary" : "text-foreground-subtle"}`} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.register.enterUsername}
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  required
                />
              </div>
			  <div className="text-xs text-foreground-subtle">{t.register.usernameHint}</div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground-muted">
                {t.register.emailAddress}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors duration-300 ${focusedField === "email" ? "text-primary" : "text-foreground-subtle"}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.register.enterEmail}
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
                {t.register.password}
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
                  placeholder={t.register.createPassword}
                  className="w-full h-12 pl-12 pr-12 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  minLength={8}
                  maxLength={100}
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
              {fieldErrors.password ? <div className="text-xs text-red-500">{fieldErrors.password}</div> : null}
              <PasswordChecklist password={formData.password} />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground-muted">
                {t.register.confirmPassword}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ShieldCheck className={`w-5 h-5 transition-colors duration-300 ${focusedField === "confirmPassword" ? "text-primary" : "text-foreground-subtle"}`} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.register.confirmYourPassword}
                  className="w-full h-12 pl-12 pr-12 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  minLength={8}
                  maxLength={100}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-primary transition-colors duration-300"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <div className="text-xs text-red-500">{fieldErrors.confirmPassword}</div>
              ) : null}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  agreedToTerms 
                    ? "bg-primary border-primary" 
                    : "border-border/70 hover:border-primary/50"
                }`}
                aria-label={t.register.agreeToTerms}
              >
                {agreedToTerms && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </button>
              <label className="text-sm text-foreground-muted leading-relaxed cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                {t.register.agreeToTerms}{" "}
                <Link href="/terms" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                  {t.register.termsOfService}
                </Link>
                {" "}{t.register.and}{" "}
                <Link href="/privacy" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                  {t.register.privacyPolicy}
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreedToTerms || isLoading}
              className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[var(--glow-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                t.register.createAccount
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-foreground-muted text-sm">
            {t.register.alreadyMember}{" "}
            <Link 
              href="/login" 
              className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary/80 hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"
            >
              {t.register.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
