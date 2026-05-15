"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useSearchParams } from "next/navigation"
import { resetPassword } from "@/lib/api"

function ResetPasswordContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Reset token is missing")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Password validation
    const password = formData.password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (password.length > 100) {
      setError("Password must be at most 100 characters long")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter")
      return
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one digit")
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError("Password must contain at least one special character")
      return
    }
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(password)) {
      setError("Password must only contain English letters, digits, and special characters")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      await resetPassword(token, password)
      setIsSuccess(true)
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
    <div className="relative backdrop-blur-xl rounded-2xl p-8 sm:p-10 bg-background-secondary/80 border border-border/60 shadow-[var(--card-shadow)]">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <img src="/favicon.svg" alt="LycorisLib" className="w-7 h-7" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-3xl font-bold tracking-tight">
              <span className="text-foreground">Lycoris</span>
              <span className="text-primary">Lib</span>
          </span>
        </Link>
      </div>

      {!isSuccess ? (
        <>
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.resetPassword.title}</h1>
            <p className="text-foreground-muted text-sm">{t.resetPassword.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
                {t.resetPassword.newPassword}
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
                  placeholder={t.resetPassword.enterNewPassword}
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
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground-muted">
                {t.resetPassword.confirmPassword}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ShieldCheck className={`w-5 h-5 transition-colors duration-300 ${focusedField === "confirmPassword" ? "text-primary" : "text-secondary/60"}`} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.resetPassword.confirmNewPassword}
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || formData.password !== formData.confirmPassword}
              className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                  <span>{t.resetPassword.updating}</span>
                </>
              ) : (
                t.resetPassword.updatePassword
              )}
            </button>
          </form>
        </>
      ) : (
        /* Success State */
        <div className="text-center py-4">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-3">{t.resetPassword.passwordUpdated}</h2>
          <p className="text-foreground-muted text-sm mb-8">
            {t.resetPassword.successMessage}
          </p>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-[1.02]"
          >
            {t.resetPassword.backToLogin}
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(0, 229, 255, 0.05) 0%, transparent 50%)",
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

      {/* Back to Login */}
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors duration-300 group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">{t.resetPassword.backToLogin}</span>
      </Link>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <Suspense fallback={<div className="text-foreground-muted">Loading reset form...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
