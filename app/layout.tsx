import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Greptile PR Bonus Dashboard',
  description: 'Review PRs and credit contributors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
