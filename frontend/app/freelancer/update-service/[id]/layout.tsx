'use client'
import React from 'react'
import { ServiceFormProvider } from '@/context/ServiceFormContext'

export default function ServiceUpdateLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ServiceFormProvider>{children}</ServiceFormProvider>
}
