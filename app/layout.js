import './globals.css'

export const metadata = {
  title: 'PermitTrack — Permit Intelligence for HVAC Contractors',
  description: 'Search building permits across Bay Area cities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
