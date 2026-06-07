import type { ReactNode } from "react"

function normalizeInput(text: string): string {
	return String(text || "").replace(/`(https?:\/\/[^`\s]+)`/g, "$1")
}

function isSafeHref(href: string): boolean {
	return /^https?:\/\//i.test(href)
}

function parseItalic(text: string, keyBase: string): ReactNode[] {
	const out: ReactNode[] = []
	let i = 0
	let seg = 0
	for (;;) {
		const start = text.indexOf("_", i)
		if (start === -1) break
		const end = text.indexOf("_", start + 1)
		if (end === -1) break
		if (start > i) out.push(text.slice(i, start))
		const inner = text.slice(start + 1, end)
		out.push(
			<em key={`${keyBase}-i-${seg}`} className="italic">
				{inner}
			</em>
		)
		seg++
		i = end + 1
	}
	if (i < text.length) out.push(text.slice(i))
	return out
}

function parseBoldItalic(text: string, keyBase: string): ReactNode[] {
	const out: ReactNode[] = []
	let i = 0
	let seg = 0
	for (;;) {
		const start = text.indexOf("**", i)
		if (start === -1) break
		const end = text.indexOf("**", start + 2)
		if (end === -1) break
		if (start > i) out.push(...parseItalic(text.slice(i, start), `${keyBase}-bi-${seg}`))
		const inner = text.slice(start + 2, end)
		out.push(
			<strong key={`${keyBase}-b-${seg}`} className="font-semibold text-foreground">
				{parseItalic(inner, `${keyBase}-b-${seg}`)}
			</strong>
		)
		seg++
		i = end + 2
	}
	if (i < text.length) out.push(...parseItalic(text.slice(i), `${keyBase}-tail`))
	return out
}

function parseAutoLinks(text: string, keyBase: string): ReactNode[] {
	const out: ReactNode[] = []
	const re = /https?:\/\/[^\s<>()\[\]]+/gi
	let last = 0
	let m: RegExpExecArray | null
	let seg = 0
	while ((m = re.exec(text))) {
		const start = m.index
		const end = start + m[0].length
		if (start > last) out.push(...parseBoldItalic(text.slice(last, start), `${keyBase}-t-${seg}`))
		const href = m[0]
		out.push(
			<a
				key={`${keyBase}-u-${seg}`}
				href={href}
				target="_blank"
				rel="noopener noreferrer nofollow"
				className="underline underline-offset-2 text-primary hover:text-primary/90 break-all"
			>
				{href}
			</a>
		)
		seg++
		last = end
	}
	if (last < text.length) out.push(...parseBoldItalic(text.slice(last), `${keyBase}-tail`))
	return out
}

function parseMarkdownLite(text: string): ReactNode[] {
	const input = normalizeInput(text)
	const out: ReactNode[] = []
	const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
	let last = 0
	let m: RegExpExecArray | null
	let seg = 0
	while ((m = re.exec(input))) {
		const start = m.index
		const end = start + m[0].length
		if (start > last) out.push(...parseAutoLinks(input.slice(last, start), `ml-${seg}-pre`))
		const label = m[1]
		const href = m[2]
		if (isSafeHref(href)) {
			out.push(
				<a
					key={`ml-${seg}-link`}
					href={href}
					target="_blank"
					rel="noopener noreferrer nofollow"
					className="underline underline-offset-2 text-primary hover:text-primary/90 break-all"
				>
					{parseAutoLinks(label, `ml-${seg}-label`)}
				</a>
			)
		} else {
			out.push(...parseAutoLinks(m[0], `ml-${seg}-raw`))
		}
		seg++
		last = end
	}
	if (last < input.length) out.push(...parseAutoLinks(input.slice(last), `ml-tail`))
	return out
}

export function MarkdownLiteText(props: { text: string; className?: string }) {
	return <span className={props.className}>{parseMarkdownLite(props.text)}</span>
}

