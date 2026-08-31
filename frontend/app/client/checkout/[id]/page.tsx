'use client'
import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CreditCard, Check, ArrowRight } from 'lucide-react';
export default function ServiceCheckout() {
  const navigate = useRouter();
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const location = useSearchParams();
  console.log(location);
  const queryParams = new URLSearchParams(location.get('tier') || '');
  const tierParam = queryParams.get('tier') || 'basic';
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Sample service data
  const service = {
    id: parseInt(id || '1'),
    title: 'I will do website ui, figma website design, website design figma, figma design website',
    seller: {
      name: 'Cyrus Roshan',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop'
    },
    image: "/Freelancer_Dashbioard-1.png",
    tiers: {
      basic: {
        name: 'Basic',
        price: 100,
        description: 'Website ui, figma website design',
        deliveryDays: 7
      },
      advanced: {
        name: 'Advanced',
        price: 180,
        description: 'Website ui, figma website design',
        deliveryDays: 7
      },
      premium: {
        name: 'Premium',
        price: 234,
        description: 'Website ui, figma website design',
        deliveryDays: 7
      }
    }
  };
  const selectedTier = service.tiers[tierParam as keyof typeof service.tiers];
  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setIsPromoApplied(true);
    }
  };
  const calculateTax = () => {
    return selectedTier.price * 0.1; // 10% tax
  };
  const calculateDiscount = () => {
    return isPromoApplied ? selectedTier.price * 0.05 : 0; // 5% discount if promo applied
  };
  const calculateTotal = () => {
    return selectedTier.price + calculateTax() - calculateDiscount();
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate.push('/client/transaction-processing');
    }, 1000);
  };
  return <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white border-b border-gray-200 py-4 px-4">
      <div className="container mx-auto flex items-center">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
          <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
          <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
        </svg>
        <span className="font-bold text-xl">Workbudd</span>
      </div>
    </header>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Service Details</h2>
            <div className="flex items-start">
              <img src={service.image} alt={service.title} className="w-20 h-20 object-cover rounded-lg mr-4" />
              <div>
                <h3 className="font-medium mb-1">{service.title}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <img src={service.seller.avatar} alt={service.seller.name} className="w-5 h-5 rounded-full mr-2" />
                  <span className="text-sm">{service.seller.name}</span>
                </div>
                <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {selectedTier.name} Package
                </div>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="space-y-4 mb-6">
              <div className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'creditCard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setPaymentMethod('creditCard')}>
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'creditCard' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'creditCard' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  </div>
                  <div className="flex items-center">
                    <CreditCard size={20} className="mr-2 text-gray-600" />
                    <span className="font-medium">Credit Card</span>
                  </div>
                </div>
                {paymentMethod === 'creditCard' && <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input type="text" id="cardNumber" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input type="text" id="expiryDate" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input type="text" id="cvv" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                      Name on Card
                    </label>
                    <input type="text" id="cardName" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="John Doe" />
                  </div>
                </div>}
              </div>
              <div className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setPaymentMethod('paypal')}>
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'paypal' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'paypal' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  </div>
                  <div className="flex items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 text-gray-600">
                      <path d="M17.4 7.8C18.2 8.6 18.6 9.6 18.6 10.8C18.6 12.4 17.8 13.6 16.4 14.4C15 15.2 13 15.6 10.4 15.6H9L8 20.4H4.8L7.2 6H13.2C14.6 6 16.2 6.6 17.4 7.8Z" />
                      <path d="M13.2 9.6C13.6 9.2 14 9 14.4 9C15.2 9 15.6 9.4 15.6 10.2C15.6 11 15.2 11.6 14.4 12C13.6 12.4 12.4 12.6 11 12.6H10.4L11 9.6H13.2Z" />
                    </svg>
                    <span className="font-medium">PayPal</span>
                  </div>
                </div>
              </div>
              <div className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'crypto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setPaymentMethod('crypto')}>
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'crypto' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'crypto' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  </div>
                  <div className="flex items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 text-gray-600">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9.354a4 4 0 1 0 0 5.292" />
                      <path d="M9 12h3.5" />
                      <path d="M9.5 10v4" />
                    </svg>
                    <span className="font-medium">Cryptocurrency</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold mb-4">Billing Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input type="text" id="firstName" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input type="text" id="lastName" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input type="text" id="address" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input type="text" id="city" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input type="text" id="state" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input type="text" id="zip" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center" disabled={isLoading}>
                {isLoading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> : <>
                  Pay ${calculateTotal().toFixed(2)}
                  <ArrowRight size={18} className="ml-2" />
                </>}
              </button>
            </div>
          </form>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {selectedTier.name} Package
                </span>
                <span>${selectedTier.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Time</span>
                <span>{selectedTier.deliveryDays} days</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex items-center mb-4">
                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Enter promo code" className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2" disabled={isPromoApplied} />
                <button type="button" onClick={handleApplyPromo} className={`px-4 py-2 rounded-r-lg ${isPromoApplied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`} disabled={isPromoApplied || !promoCode.trim()}>
                  {isPromoApplied ? <Check size={18} /> : 'Apply'}
                </button>
              </div>
              {isPromoApplied && <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 flex items-center text-green-700 text-sm">
                <Check size={16} className="mr-1" />
                <span>Promo code applied successfully!</span>
              </div>}
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${selectedTier.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              {isPromoApplied && <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${calculateDiscount().toFixed(2)}</span>
              </div>}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}