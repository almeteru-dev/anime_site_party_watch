"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Send, CheckCircle2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useSearchParams } from "next/navigation"
import { resendVerificationEmail } from "@/lib/api"

function VerifyEmailContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showResendSuccess, setShowResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleResend = async () => {
    if (!canResend || !email) return
    setIsResending(true)
    setError(null)
    
    try {
      await resendVerificationEmail(email)
      setShowResendSuccess(true)
      setCountdown(60)
      setCanResend(false)
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowResendSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Gradient border effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/50 via-secondary/20 to-transparent rounded-2xl pointer-events-none" />
      
      <div 
        className="relative backdrop-blur-xl rounded-2xl p-8 sm:p-10 bg-background-secondary/85 border border-border shadow-lg"
      >
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

        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="relative w-24 h-24"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative w-full h-full bg-gradient-to-br from-background-secondary to-background-tertiary rounded-full flex items-center justify-center border border-primary/30">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              !
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-orange-400 bg-orange-400/10 rounded-full mb-3">
            {t.verifyEmail.subtitle}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t.verifyEmail.title}</h1>
          <p className="text-foreground-muted text-sm leading-relaxed">
            {t.verifyEmail.messageLine1}
            <br />
            {t.verifyEmail.messageLine2}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Resend Success Message */}
        {showResendSuccess && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-primary font-medium text-sm">{t.verifyEmail.emailResent}</p>
              <p className="text-foreground-muted text-xs">{t.verifyEmail.checkInbox}</p>
            </div>
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={!canResend || isResending}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isResending ? (
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
              <span>{t.common.loading}</span>
            </>
          ) : canResend ? (
            <>
              <Send className="w-5 h-5" />
              {t.verifyEmail.resendEmail}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t.verifyEmail.resendIn} {countdown}s
            </>
          )}
        </button>

        {/* Back to Login Link */}
        <p className="text-center mt-6 text-foreground-muted text-sm">
          <Link 
            href="/login" 
            className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary/80"
          >
            {t.verifyEmail.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(0, 229, 255, 0.06) 0%, transparent 50%)",
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
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          animation: "scanline 8s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Back to Login */}
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors duration-300 group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-sm font-medium">{t.verifyEmail.backToLogin}</span>
      </Link>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <Suspense fallback={<div className="text-foreground-muted">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
