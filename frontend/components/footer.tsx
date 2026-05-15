"use client"

import { useEffect, useState } from "react"
import { Send } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { getPublicSettings, type FooterSocialLinks } from "@/lib/api"
import { InstagramIcon, TwitterIcon, VkIcon, WhatsAppIcon } from "@/components/social-icons"

export function Footer() {
  const { t } = useLanguage()
	const [contactURL, setContactURL] = useState<string>("")
	const [social, setSocial] = useState<FooterSocialLinks>({
		telegram_url: "https://t.me/",
		vk: { enabled: false, url: "" },
		twitter: { enabled: false, url: "" },
		instagram: { enabled: false, url: "" },
		whatsapp: { enabled: false, url: "" },
	})

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				setContactURL(s.footer_contact_url || "")
				setSocial(s.footer_social_links)
			} catch {
				;
			}
		})()
		return () => {
			mounted = false
		}
	}, [])
  
  return (
    <footer className="bg-background/80 backdrop-blur-xl border-t border-border pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo & Tagline */}
          <div className="text-center lg:text-left">
            <a href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <img src="/favicon.svg" alt="LycorisLib" className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-foreground">Lycoris</span>
                <span className="text-primary">Lib</span>
              </span>
            </a>
            <p className="text-foreground-muted text-sm mt-2">
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            <Link href="/privacy" className="text-foreground-muted hover:text-primary transition-colors text-sm">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/terms" className="text-foreground-muted hover:text-primary transition-colors text-sm">
              {t.footer.termsOfService}
            </Link>
            <Link href="/cookies" className="text-foreground-muted hover:text-primary transition-colors text-sm">
              {t.footer.cookiePolicy}
            </Link>
            <Link href="/dmca" className="text-foreground-muted hover:text-primary transition-colors text-sm">
              {t.footer.dmca}
            </Link>
            <a href={contactURL.trim() || "#contact"} className="text-foreground-muted hover:text-primary transition-colors text-sm">
              {t.footer.contact}
            </a>
			<Link href="/faq" className="text-foreground-muted hover:text-primary transition-colors text-sm">
				{t.footer.faq}
			</Link>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
				  href={social.telegram_url || "https://t.me/"}
				  target="_blank"
				  rel="noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:border-primary border border-transparent transition-all duration-200 group"
              aria-label="Telegram"
            >
              <Send className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
            </a>
			{social.vk.enabled ? (
				<a
					href={social.vk.url}
					target="_blank"
					rel="noreferrer"
					className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:border-primary border border-transparent transition-all duration-200 group"
					aria-label="VK"
				>
					<VkIcon className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
				</a>
			) : null}
			{social.twitter.enabled ? (
				<a
					href={social.twitter.url}
					target="_blank"
					rel="noreferrer"
					className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:border-primary border border-transparent transition-all duration-200 group"
					aria-label="Twitter"
				>
					<TwitterIcon className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
				</a>
			) : null}
			{social.instagram.enabled ? (
				<a
					href={social.instagram.url}
					target="_blank"
					rel="noreferrer"
					className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:border-primary border border-transparent transition-all duration-200 group"
					aria-label="Instagram"
				>
					<InstagramIcon className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
				</a>
			) : null}
			{social.whatsapp.enabled ? (
				<a
					href={social.whatsapp.url}
					target="_blank"
					rel="noreferrer"
					className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:border-primary border border-transparent transition-all duration-200 group"
					aria-label="WhatsApp"
				>
					<WhatsAppIcon className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
				</a>
			) : null}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-foreground-muted text-sm">
            © {new Date().getFullYear()} LycorisLib. {t.footer.copyright}
          </p>
          <p className="text-foreground-muted/60 text-xs mt-2">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  )
}
