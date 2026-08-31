import React from 'react'
export function Footer() {
  return (
    <footer className="text-center text-sm text-gray-600 mt-8 mb-6">
      <p>
        by Signing Up, i agree with Organaise{' '}
        <a href="#" className="text-[#3b7ded] hover:underline">
          privacy policy
        </a>{' '}
        and{' '}
        <a href="#" className="text-[#3b7ded] hover:underline">
          terms and conditions
        </a>
      </p>
    </footer>
  )
}
