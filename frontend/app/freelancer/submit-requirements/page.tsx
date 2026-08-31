'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Upload, Check, ChevronUp } from 'lucide-react';
export default function ClientRequirementForm() {
  const navigate = useRouter();
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [questions, setQuestions] = useState([{
    id: 1,
    question: "HOW DO I BECOME A PART OF ORGANAISE'S FREELANCE NETWORK?",
    answer: ''
  }, {
    id: 2,
    question: "HOW DO I BECOME A PART OF ORGANAISE'S FREELANCE NETWORK?",
    answer: 'You Should have to work on that.'
  }]);
  const [promoCode, setPromoCode] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const handleAnswerChange = (id: number, answer: string) => {
    setQuestions(questions.map(q => q.id === id ? {
      ...q,
      answer
    } : q));
  };
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };
  const handleSendRequirements = () => {
    // Send requirements logic here
    navigate.push('/profile/dashboard');
  };
  const handleRemindLater = () => {
    navigate.push('/profile/dashboard');
  };
  return <div className="min-h-screen bg-white flex flex-col">
    {/* Header */}
    <header className="border-b border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center">
          <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8">
            <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
            <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
            <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
            <path d="M48.8 23V10.6H53.84C55.12 10.6 56.1467 10.96 56.92 11.68C57.7067 12.3867 58.1 13.3333 58.1 14.52C58.1 15.6933 57.7067 16.64 56.92 17.36C56.1467 18.0667 55.12 18.42 53.84 18.42H51.24V23H48.8ZM51.24 16.32H53.56C54.16 16.32 54.6267 16.1467 54.96 15.8C55.2933 15.44 55.46 15.0133 55.46 14.52C55.46 14.0133 55.2933 13.5867 54.96 13.24C54.6267 12.88 54.16 12.7 53.56 12.7H51.24V16.32Z" fill="#161616" />
            <path d="M66.6909 23.28C65.6909 23.28 64.7976 23.0733 64.0109 22.66C63.2242 22.2467 62.6109 21.6733 62.1709 20.94C61.7442 20.1933 61.5309 19.3467 61.5309 18.4C61.5309 17.4533 61.7509 16.6133 62.1909 15.88C62.6309 15.1333 63.2509 14.56 64.0509 14.16C64.8509 13.76 65.7509 13.56 66.7509 13.56C67.7509 13.56 68.6442 13.76 69.4309 14.16C70.2309 14.56 70.8509 15.1333 71.2909 15.88C71.7309 16.6133 71.9509 17.4533 71.9509 18.4C71.9509 19.3467 71.7242 20.1933 71.2709 20.94C70.8309 21.6733 70.2042 22.2467 69.3909 22.66C68.5909 23.0733 67.6909 23.28 66.6909 23.28ZM66.6909 21.18C67.1709 21.18 67.6109 21.0733 68.0109 20.86C68.4242 20.6333 68.7509 20.3133 68.9909 19.9C69.2309 19.4733 69.3509 18.9733 69.3509 18.4C69.3509 17.8267 69.2309 17.3333 68.9909 16.92C68.7509 16.4933 68.4242 16.1733 68.0109 15.96C67.6109 15.7333 67.1776 15.62 66.7109 15.62C66.2309 15.62 65.7909 15.7333 65.3909 15.96C64.9909 16.1733 64.6642 16.4933 64.4109 16.92C64.1709 17.3333 64.0509 17.8267 64.0509 18.4C64.0509 18.9733 64.1709 19.4733 64.4109 19.9C64.6642 20.3133 64.9909 20.6333 65.3909 20.86C65.7909 21.0733 66.2242 21.18 66.6909 21.18Z" fill="#161616" />
            <path d="M80.6938 13.56C81.6004 13.56 82.4004 13.7533 83.0938 14.14C83.8004 14.5267 84.3338 15.08 84.6938 15.8C85.0671 16.5067 85.2538 17.3467 85.2538 18.32V23H82.7738V18.7C82.7738 17.8867 82.5604 17.2667 82.1338 16.84C81.7204 16.4 81.1538 16.18 80.4338 16.18C79.7138 16.18 79.1404 16.4 78.7138 16.84C78.3004 17.2667 78.0938 17.8867 78.0938 18.7V23H75.6138V13.84H78.0938V14.96C78.4404 14.5467 78.8804 14.2267 79.4138 14C79.9471 13.7733 80.5271 13.56 81.1538 13.56H80.6938Z" fill="#161616" />
            <path d="M95.5078 13.84V23H93.0278V21.88C92.6811 22.2933 92.2411 22.6133 91.7078 22.84C91.1745 23.0533 90.6011 23.16 89.9878 23.16C89.1611 23.16 88.4211 22.9733 87.7678 22.6C87.1145 22.2133 86.6011 21.6667 86.2278 20.96C85.8678 20.24 85.6878 19.4 85.6878 18.44V13.84H88.1678V18.14C88.1678 18.9533 88.3745 19.5733 88.7878 20C89.2145 20.4133 89.7878 20.62 90.5078 20.62C91.2278 20.62 91.8011 20.4133 92.2278 20C92.6545 19.5733 92.8678 18.9533 92.8678 18.14V13.84H95.5078Z" fill="#161616" />
            <path d="M98.6344 23V10.6H101.114V15.02C101.461 14.5933 101.901 14.2667 102.434 14.04C102.968 13.8 103.554 13.68 104.194 13.68C105.128 13.68 105.968 13.88 106.714 14.28C107.474 14.6667 108.074 15.2267 108.514 15.96C108.954 16.6933 109.174 17.54 109.174 18.5C109.174 19.46 108.954 20.3067 108.514 21.04C108.074 21.7733 107.474 22.34 106.714 22.74C105.968 23.1267 105.128 23.32 104.194 23.32C103.554 23.32 102.968 23.2067 102.434 22.98C101.901 22.74 101.461 22.4067 101.114 21.98V23H98.6344ZM103.754 21.16C104.501 21.16 105.114 20.92 105.594 20.44C106.088 19.9467 106.334 19.3 106.334 18.5C106.334 17.7 106.088 17.06 105.594 16.58C105.114 16.0867 104.501 15.84 103.754 15.84C103.008 15.84 102.388 16.0867 101.894 16.58C101.414 17.06 101.174 17.7 101.174 18.5C101.174 19.3 101.414 19.9467 101.894 20.44C102.388 20.92 103.008 21.16 103.754 21.16Z" fill="#161616" />
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6">
            <button className="text-gray-700 hover:text-black">
              Find Talent
            </button>
            <button className="text-gray-700 hover:text-black">
              Find Jobs
            </button>
            <button className="text-gray-700 hover:text-black">
              Find Work
            </button>
          </div>
          <div className="hidden md:flex items-center border rounded-full px-4 py-2 gap-2">
            <input type="text" placeholder="Search your industry here..." className="outline-none text-sm w-48" />
            <div className="flex items-center gap-1 text-gray-600">
              <span className="text-sm">Freelancer</span>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button className="text-gray-800 hover:text-black">Log In</button>
            <button className="bg-[#0F1E36] text-white px-4 py-2 rounded-full">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 py-8">
      <div className="md:w-2/3 pr-0 md:pr-8 mb-8 md:mb-0">
        <h1 className="text-3xl font-bold mb-2">Submit Your Requirements</h1>
        <p className="text-gray-700 mb-6">
          Cyrus will not start working until you submit the requirement.
        </p>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Questions</h2>
          <div className="space-y-4">
            {questions.map(q => <div key={q.id} className="border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-2">{q.question}</p>
              <div className="flex items-center">
                <span className="text-gray-800 font-medium mr-2">
                  Ans :
                </span>
                <input type="text" value={q.answer} onChange={e => handleAnswerChange(q.id, e.target.value)} className="flex-1 outline-none" placeholder="Your answer..." />
              </div>
            </div>)}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Upload Document</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="uppercase text-xs text-gray-500 mb-4">
              ADD YOUR DOCUMENT
            </p>
            <label className="flex items-center cursor-pointer">
              <Upload size={20} className="text-gray-500 mr-2" />
              <span className="text-gray-600 hover:text-blue-500">
                {document ? document.name : 'Click here to upload Your Resume'}
              </span>
              <input type="file" className="hidden" onChange={handleDocumentUpload} />
            </label>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleRemindLater} className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50">
            Remind me, Later
          </button>
          <button onClick={handleSendRequirements} className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800">
            Send Requirements
          </button>
        </div>
      </div>
      <div className="md:w-1/3 bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <button onClick={() => setShowOrderSummary(!showOrderSummary)} className="text-gray-500">
            {showOrderSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {showOrderSummary && <>
          <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-200">
            <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
              <img src="/Organaise_Home_Page.png" alt="Service" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-800">
              I will do website ui, figma website design, website design
              figma, figma design website
            </p>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Tier</span>
              <span className="font-medium">$10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Time</span>
              <span className="font-medium">3 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commercial Use</span>
              <div className="bg-gray-100 w-5 h-5 rounded-full flex items-center justify-center">
                <Check size={14} className="text-gray-700" />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Source File</span>
              <div className="bg-gray-100 w-5 h-5 rounded-full flex items-center justify-center">
                <Check size={14} className="text-gray-700" />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interactive Mockup</span>
              <div className="bg-gray-100 w-5 h-5 rounded-full flex items-center justify-center">
                <Check size={14} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">
              Have a Promo code ?
            </label>
            <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="w-full border-b border-gray-300 pb-1 outline-none" placeholder="Enter promo code" />
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">$10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes</span>
              <span className="font-medium">$2</span>
            </div>
            <div className="flex justify-between font-medium pt-2">
              <span>Final Paid Amount</span>
              <span>$12</span>
            </div>
          </div>
        </>}
      </div>
    </div>
    {/* Footer */}
    <footer className="bg-gray-900 text-white py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <svg width="150" height="40" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
            <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
            <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
            <path d="M48.8 23V10.6H53.84C55.12 10.6 56.1467 10.96 56.92 11.68C57.7067 12.3867 58.1 13.3333 58.1 14.52C58.1 15.6933 57.7067 16.64 56.92 17.36C56.1467 18.0667 55.12 18.42 53.84 18.42H51.24V23H48.8ZM51.24 16.32H53.56C54.16 16.32 54.6267 16.1467 54.96 15.8C55.2933 15.44 55.46 15.0133 55.46 14.52C55.46 14.0133 55.2933 13.5867 54.96 13.24C54.6267 12.88 54.16 12.7 53.56 12.7H51.24V16.32Z" fill="white" />
            <path d="M66.6909 23.28C65.6909 23.28 64.7976 23.0733 64.0109 22.66C63.2242 22.2467 62.6109 21.6733 62.1709 20.94C61.7442 20.1933 61.5309 19.3467 61.5309 18.4C61.5309 17.4533 61.7509 16.6133 62.1909 15.88C62.6309 15.1333 63.2509 14.56 64.0509 14.16C64.8509 13.76 65.7509 13.56 66.7509 13.56C67.7509 13.56 68.6442 13.76 69.4309 14.16C70.2309 14.56 70.8509 15.1333 71.2909 15.88C71.7309 16.6133 71.9509 17.4533 71.9509 18.4C71.9509 19.3467 71.7242 20.1933 71.2709 20.94C70.8309 21.6733 70.2042 22.2467 69.3909 22.66C68.5909 23.0733 67.6909 23.28 66.6909 23.28ZM66.6909 21.18C67.1709 21.18 67.6109 21.0733 68.0109 20.86C68.4242 20.6333 68.7509 20.3133 68.9909 19.9C69.2309 19.4733 69.3509 18.9733 69.3509 18.4C69.3509 17.8267 69.2309 17.3333 68.9909 16.92C68.7509 16.4933 68.4242 16.1733 68.0109 15.96C67.6109 15.7333 67.1776 15.62 66.7109 15.62C66.2309 15.62 65.7909 15.7333 65.3909 15.96C64.9909 16.1733 64.6642 16.4933 64.4109 16.92C64.1709 17.3333 64.0509 17.8267 64.0509 18.4C64.0509 18.9733 64.1709 19.4733 64.4109 19.9C64.6642 20.3133 64.9909 20.6333 65.3909 20.86C65.7909 21.0733 66.2242 21.18 66.6909 21.18Z" fill="white" />
            <path d="M80.6938 13.56C81.6004 13.56 82.4004 13.7533 83.0938 14.14C83.8004 14.5267 84.3338 15.08 84.6938 15.8C85.0671 16.5067 85.2538 17.3467 85.2538 18.32V23H82.7738V18.7C82.7738 17.8867 82.5604 17.2667 82.1338 16.84C81.7204 16.4 81.1538 16.18 80.4338 16.18C79.7138 16.18 79.1404 16.4 78.7138 16.84C78.3004 17.2667 78.0938 17.8867 78.0938 18.7V23H75.6138V13.84H78.0938V14.96C78.4404 14.5467 78.8804 14.2267 79.4138 14C79.9471 13.7733 80.5271 13.56 81.1538 13.56H80.6938Z" fill="white" />
            <path d="M95.5078 13.84V23H93.0278V21.88C92.6811 22.2933 92.2411 22.6133 91.7078 22.84C91.1745 23.0533 90.6011 23.16 89.9878 23.16C89.1611 23.16 88.4211 22.9733 87.7678 22.6C87.1145 22.2133 86.6011 21.6667 86.2278 20.96C85.8678 20.24 85.6878 19.4 85.6878 18.44V13.84H88.1678V18.14C88.1678 18.9533 88.3745 19.5733 88.7878 20C89.2145 20.4133 89.7878 20.62 90.5078 20.62C91.2278 20.62 91.8011 20.4133 92.2278 20C92.6545 19.5733 92.8678 18.9533 92.8678 18.14V13.84H95.5078Z" fill="white" />
            <path d="M98.6344 23V10.6H101.114V15.02C101.461 14.5933 101.901 14.2667 102.434 14.04C102.968 13.8 103.554 13.68 104.194 13.68C105.128 13.68 105.968 13.88 106.714 14.28C107.474 14.6667 108.074 15.2267 108.514 15.96C108.954 16.6933 109.174 17.54 109.174 18.5C109.174 19.46 108.954 20.3067 108.514 21.04C108.074 21.7733 107.474 22.34 106.714 22.74C105.968 23.1267 105.128 23.32 104.194 23.32C103.554 23.32 102.968 23.2067 102.434 22.98C101.901 22.74 101.461 22.4067 101.114 21.98V23H98.6344ZM103.754 21.16C104.501 21.16 105.114 20.92 105.594 20.44C106.088 19.9467 106.334 19.3 106.334 18.5C106.334 17.7 106.088 17.06 105.594 16.58C105.114 16.0867 104.501 15.84 103.754 15.84C103.008 15.84 102.388 16.0867 101.894 16.58C101.414 17.06 101.174 17.7 101.174 18.5C101.174 19.3 101.414 19.9467 101.894 20.44C102.388 20.92 103.008 21.16 103.754 21.16Z" fill="white" />
          </svg>
          <p className="text-gray-400 mb-4">
            X Y Z Locality, <br />
            California, USA, 292332
          </p>
          <div className="mb-4">
            <h3 className="text-lg mb-2">Follow us on social :</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Company</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Website</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                FAQ's
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Get In Touch
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Others</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Profile
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Sign In
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Sign Up
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Java Script
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-8 mt-8 border-t border-gray-800 text-center text-gray-400">
        <p>copyright @ Workbudd</p>
      </div>
    </footer>
  </div>;
}