import React from 'react'
import Link from 'next/link'
export function ComingSoon() {
  return (
    <div className="py-32 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-12 max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 8H22M2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8M2 8L4.46154 3.38462C4.76923 2.86154 5.38462 2.5 6 2.5H18C18.6154 2.5 19.2308 2.86154 19.5385 3.38462L22 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-[80px] leading-none font-bold text-gray-200 mb-4">
          COMING SOON
        </h1>
        <Link
          href="/dashboard"
          className="inline-block py-3 px-8 rounded-full bg-rainbow-gradient text-white font-medium"
        >
          Go Back
        </Link>
      </div>
    </div>
  )
}
