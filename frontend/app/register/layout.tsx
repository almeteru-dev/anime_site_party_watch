import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register - LycorisLib',
  description: 'Create your LycorisLib account and start streaming your favorite anime.',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
