export default function VerifyConfirmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen">
      {children}
    </main>
  )
}
