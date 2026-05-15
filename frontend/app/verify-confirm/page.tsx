"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { CheckCircle2, Sparkles, XCircle, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useSearchParams } from "next/navigation"
import { verifyEmailToken } from "@/lib/api"
import { cn } from "@/lib/utils"

function VerifyConfirmContent({ onStatusChange }: { onStatusChange: (s: "loading" | "success" | "error") => void }) {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error")
        setErrorMessage(t.verifyConfirm?.tokenMissing || "Verification token is missing")
        return
      }

      try {
        await verifyEmailToken(token)
        setStatus("success")
        onStatusChange("success")
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.message)
        onStatusChange("error")
      }
    }

    verify()
  }, [token])

  return (
    <div 
      className={cn(
        "relative backdrop-blur-xl rounded-2xl p-8 sm:p-10 text-center bg-background-secondary/85 border shadow-lg",
        status === "error" ? "border-destructive/25" : "border-border"
      )}
    >
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <img src="/favicon.svg" alt="LycorisLib" className="w-7 h-7" />
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">Lycoris</span>
            <span className="text-primary">Lib</span>
          </span>
        </Link>
      </div>

      {status === "loading" && (
        <div className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-foreground-muted">{t.common?.loading || "Verifying..."}</p>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="flex justify-center mb-6">
            <div className="relative w-28 h-28" style={{ animation: "bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-14 h-14 text-primary-foreground" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary" style={{ animation: "sparkle 2s ease-in-out infinite" }} />
            </div>
          </div>

          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-3">
              {t.verifyConfirm.subtitle}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t.verifyConfirm.title}</h1>
            <p className="text-foreground-muted text-sm leading-relaxed">
              {t.verifyConfirm.message}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {t.verifyConfirm.login}
            </Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex justify-center mb-6">
            <div className="relative w-28 h-28" style={{ animation: "bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                <XCircle className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t.verifyConfirm?.errorTitle || "Verification Failed"}</h1>
            <p className="text-destructive text-sm leading-relaxed mb-4">
              {errorMessage}
            </p>
            <p className="text-foreground-muted text-sm leading-relaxed">
              {t.verifyConfirm?.errorHint || "The link may be invalid or expired. Please try to register again or request a new verification link."}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/register"
              className="w-full h-12 bg-secondary text-secondary-foreground font-semibold rounded-xl transition-all duration-300 hover:bg-secondary/80 flex items-center justify-center gap-2"
            >
              {t.verifyConfirm?.backToRegistration || "Back to Registration"}
            </Link>
            <Link
              href="/login"
              className="text-primary font-medium hover:underline text-sm"
            >
              {t.verifyConfirm?.backToLogin || "Back to Login"}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function VerifyConfirmPage() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: status === "error" 
            ? "radial-gradient(ellipse at 50% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)"
            : "radial-gradient(ellipse at 50% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(0, 200, 255, 0.05) 0%, transparent 40%)",
        }}
      />
      
      {/* Decorative watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25rem] font-bold text-secondary/[0.02] select-none pointer-events-none leading-none tracking-tighter">
        LL
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Floating particles effect */}
      {status === "success" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `float-particle ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

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
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
      `}</style>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Gradient border effect */}
        <div className={`absolute -inset-[1px] rounded-2xl pointer-events-none ${
          status === "error" 
            ? "bg-gradient-to-br from-red-500/50 via-transparent to-transparent" 
            : "bg-gradient-to-br from-primary/60 via-secondary/30 to-primary/20"
        }`} />
        
        <Suspense fallback={<div className="text-foreground-muted text-center py-12">{t.common.loading}</div>}>
          <VerifyConfirmContent onStatusChange={setStatus} />
        </Suspense>
      </div>
    </div>
  )
}
