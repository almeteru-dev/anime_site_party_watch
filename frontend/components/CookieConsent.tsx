"use client"

import Link from "next/link"
import React from "react"
import { useLanguage } from "@/contexts/language-context"

const STORAGE_KEY = "ll_cc_accepted"

export default function CookieConsent() {
  const { t } = useLanguage()
  const [accepted, setAccepted] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY)
      setAccepted(v === "1")
    } catch {
      setAccepted(false)
    }
  }, [])

  const onAccept = React.useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {}
    setAccepted(true)
  }, [])

  if (accepted) return null
  if (accepted === null) return null

  return (
    <div className="ll-cc-wrapper" role="dialog" aria-live="polite">
      <div className="ll-cc" role="region" aria-label="Cookie Consent">
        <div className="ll-cc__text">
          {t.cookieConsent.text}{" "}
          <Link className="ll-cc__link" href="/cookies">
            {t.cookieConsent.link}
          </Link>
          .
        </div>
        <button className="ll-cc__btn" onClick={onAccept} aria-label="Accept cookies">
          {t.cookieConsent.button}
        </button>
      </div>

      <style jsx>{`
        .ll-cc {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 60;
          max-width: 560px;
          margin: 0 auto;
          color: var(--foreground);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--card-shadow);
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .ll-cc {
            right: 20px;
            left: auto;
            width: 420px;
            bottom: 20px;
          }
        }

        .ll-cc__text {
          padding: 16px 18px;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 400;
          color: var(--foreground-muted);
          letter-spacing: 0.0125em;
        }

        .ll-cc__link {
          font-weight: 700;
          color: var(--foreground);
          text-decoration: none;
          border-bottom: 1px solid color-mix(in srgb, var(--foreground) 45%, transparent);
        }

        .ll-cc__link:hover {
          border-bottom-color: var(--foreground);
        }

        .ll-cc__btn {
          width: calc(100% - 28px);
          margin: 10px 14px 14px;
          appearance: none;
          border: 0;
          border-radius: 8px;
          height: 40px;
          background: var(--foreground);
          color: var(--background-secondary);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.06s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08), 0 8px 20px rgba(15, 23, 42, 0.12);
        }

        .ll-cc__btn:hover {
          transform: translateY(-1px);
        }

        .ll-cc__btn:active {
          transform: translateY(0);
        }

        .ll-cc__btn:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        .ll-cc-wrapper {
          transform: translateY(24px);
          opacity: 0;
          animation: cc-in 0.28s ease forwards;
        }

        @keyframes cc-in {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ll-cc-wrapper {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .ll-cc__btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
