import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://whytepyramid.com'),
  title: 'Whyte Pyramid Academy',
  description: 'Academic management portal for tutors, learners, and administrators',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Whyte Pyramid Academy',
    description: 'Modern academic portal for managing tutors, learners, lessons, and CBT assessments',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
