import React from 'react'
import Link from 'next/link'
import { ProgressStepper } from '@/components/progress-stepper'
export default function OnboardingWelcome() {
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
     
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <ProgressStepper currentStep={1} totalSteps={5} />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-bold text-[#161616] mb-6">
                Embark on Your Freelancing Journey in Just 3 Simple Steps
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Unlock the full potential of your freelance career with
                Organaise. Begin a rewarding journey where your skills are
                valued and your professional growth is inevitable. Start now and
                pave the path to your success.
              </p>
              <div>
                <Link href="/onboarding/profile">
                <button
                  
                  className="bg-[#000000] text-white py-3 px-8 rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
                </Link>
              </div>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <img
                        src="https://uploadthingy.s3.us-west-1.amazonaws.com/fXxDYJqvLnBFoPyUAB8BiD/Organaise_Freelancer_Onboarding_-_11.png"
                        alt="Profile setup"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#161616] mb-2">
                      1. Set Up Your Professional Profile
                    </h3>
                    <p className="text-gray-600">
                      Create your identity on Organaise by setting up a detailed
                      profile. Highlight your expertise, define your niche, and
                      let your experience speak for itself. A strong profile is
                      the first step to standing out in a competitive
                      marketplace.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <img
                        src="https://uploadthingy.s3.us-west-1.amazonaws.com/97t5MRhvuT3fKKFQYzSXRj/Organaise_Freelancer_Onboarding_-_10.png"
                        alt="Portfolio"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#161616] mb-2">
                      2. Enhance Your Portfolio & Expand Your Skillset
                    </h3>
                    <p className="text-gray-600">
                      Showcase your best work and keep learning. Update your
                      portfolio with your latest projects and achievements. With
                      Organaise, you also gain access to exclusive resources for
                      skill enhancement to stay ahead of the curve.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <img
                        src="https://uploadthingy.s3.us-west-1.amazonaws.com/oD766hXGPzJWBhJce8amJi/Organaise_Freelancer_Onboarding_-_8.png"
                        alt="Connect with clients"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#161616] mb-2">
                      3. Connect with Clients & Start Earning
                    </h3>
                    <p className="text-gray-600">
                      Dive into a world of opportunities. Browse projects that
                      match your skillset, connect with premier clients, and
                      start earning. With Organaise, every project is a new
                      horizon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center text-sm text-gray-600 py-6">
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
    </div>
  )
}
