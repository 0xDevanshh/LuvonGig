'use client'
import { ServiceFormProvider } from '@/context/ServiceFormContext'

export default function AddServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ServiceFormProvider>
      {children}
    </ServiceFormProvider>
  )
}

