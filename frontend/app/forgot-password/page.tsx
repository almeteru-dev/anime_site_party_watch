"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle2, Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { forgotPassword } from "@/lib/api"

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      await forgotPassword(email)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
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

      {/* Back to Login */}
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors duration-300 group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">{t.forgotPassword.backToLogin}</span>
      </Link>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/40 via-transparent to-transparent rounded-2xl pointer-events-none" />
        
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
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.forgotPassword.title}</h1>
                <p className="text-foreground-muted text-sm">{t.forgotPassword.subtitle}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground-muted">
                    {t.forgotPassword.emailAddress}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail className={`w-5 h-5 transition-colors duration-300 ${focusedField === "email" ? "text-primary" : "text-foreground-subtle"}`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t.forgotPassword.enterEmail}
                      className="w-full h-12 pl-12 pr-4 bg-background border border-border/60 rounded-xl text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                      required
                    />
                  </div>
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
                      <span>{t.forgotPassword.sending}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t.forgotPassword.sendResetLink}
                    </>
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
              
              <h2 className="text-2xl font-bold text-foreground mb-3">{t.forgotPassword.checkEmail}</h2>
              <p className="text-foreground-muted text-sm mb-2">
                {t.forgotPassword.emailSentTo}
              </p>
              <p className="text-primary font-medium mb-6">{email}</p>
              
              <p className="text-foreground-muted text-sm">
                {t.forgotPassword.didntReceive}{" "}
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="text-primary hover:underline font-medium"
                >
                  {t.forgotPassword.resendEmail}
                </button>
              </p>
            </div>
          )}

          {/* Back to Login Link */}
          <p className="text-center mt-8 text-foreground-muted text-sm">
            <Link 
              href="/login" 
              className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary/80 hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"
            >
              {t.forgotPassword.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
