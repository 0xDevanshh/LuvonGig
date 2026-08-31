// Simple in-memory storage for testing marketplace data
// In production, this would be replaced with real canister calls

interface Service {
  service_id: string;
  freelancer_id: string;
  freelancer_email: string;
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  whats_included: string;
  cover_image_url?: string;
  portfolio_images: string[];
  status: 'Active' | 'Paused' | 'Deleted';
  created_at: number;
  updated_at: number;
  delivery_time_days: number;
  starting_from_e8s: bigint;
  total_rating: number;
  review_count: number;
  tags: string[];
}

interface Package {
  package_id: string;
  service_id: string;
  name: string;
  description: string;
  price_e8s: bigint;
  delivery_time_days: number;
  revisions: number;
  features: string[];
  is_active: boolean;
  created_at: number;
}

// Test data
const services: Service[] = [
  {
    service_id: 'SVC_TEST_001',
    freelancer_id: 'freelancer_test_001',
    freelancer_email: 'freelancer@example.com',
    title: 'Professional Web Development',
    main_category: 'Web Development',
    sub_category: 'Frontend Development',
    description: 'I will create modern, responsive web applications using React, Next.js, and TypeScript. Includes clean code, responsive design, and basic SEO optimization.',
    whats_included: '✓ Responsive design ✓ Modern React/Next.js ✓ TypeScript ✓ Basic SEO ✓ Clean architecture ✓ Performance optimization',
    cover_image_url: undefined,
    portfolio_images: [],
    status: 'Active',
    created_at: Date.now(),
    updated_at: Date.now(),
    delivery_time_days: 7,
    starting_from_e8s: BigInt(500000000), // 5 ICP
    total_rating: 4.8,
    review_count: 25,
    tags: ['react', 'nextjs', 'typescript', 'responsive', 'modern']
  },
  {
    service_id: 'SVC_TEST_002',
    freelancer_id: 'freelancer_test_002',
    freelancer_email: 'designer@example.com',
    title: 'UI/UX Design Services',
    main_category: 'Design',
    sub_category: 'UI/UX Design',
    description: 'Professional UI/UX design for web and mobile applications. User research, wireframing, prototyping, and high-fidelity designs.',
    whats_included: '✓ User research ✓ Wireframing ✓ Prototyping ✓ High-fidelity designs ✓ Design system',
    cover_image_url: undefined,
    portfolio_images: [],
    status: 'Active',
    created_at: Date.now(),
    updated_at: Date.now(),
    delivery_time_days: 5,
    starting_from_e8s: BigInt(300000000), // 3 ICP
    total_rating: 4.9,
    review_count: 18,
    tags: ['ui', 'ux', 'figma', 'design', 'prototype']
  }
];

const packages: Package[] = [
  {
    package_id: 'PKG_TEST_001_BASIC',
    service_id: 'SVC_TEST_001',
    name: 'Basic Website',
    description: 'Simple responsive landing page with up to 5 sections',
    price_e8s: BigInt(500000000), // 5 ICP
    delivery_time_days: 7,
    revisions: 2,
    features: [
      'Responsive design',
      'Up to 5 sections',
      'Contact form',
      'Basic SEO',
      'Source code included'
    ],
    is_active: true,
    created_at: Date.now()
  },
  {
    package_id: 'PKG_TEST_001_STANDARD',
    service_id: 'SVC_TEST_001',
    name: 'Standard Web App',
    description: 'Multi-page web application with advanced features',
    price_e8s: BigInt(1000000000), // 10 ICP
    delivery_time_days: 14,
    revisions: 3,
    features: [
      'Everything in Basic',
      'Up to 10 pages',
      'Database integration',
      'User authentication',
      'Admin dashboard',
      'Advanced SEO'
    ],
    is_active: true,
    created_at: Date.now()
  },
  {
    package_id: 'PKG_TEST_001_PREMIUM',
    service_id: 'SVC_TEST_001',
    name: 'Premium Full-Stack',
    description: 'Complete full-stack web application with deployment',
    price_e8s: BigInt(2000000000), // 20 ICP
    delivery_time_days: 21,
    revisions: 5,
    features: [
      'Everything in Standard',
      'API development',
      'Payment integration',
      'Cloud deployment',
      '3 months support',
      'Performance optimization'
    ],
    is_active: true,
    created_at: Date.now()
  },
  {
    package_id: 'PKG_TEST_002_BASIC',
    service_id: 'SVC_TEST_002',
    name: 'Basic UI Design',
    description: 'UI design for up to 5 screens',
    price_e8s: BigInt(300000000), // 3 ICP
    delivery_time_days: 5,
    revisions: 2,
    features: [
      'Up to 5 screens',
      'High-fidelity designs',
      'Design guidelines',
      'Source files (Figma)'
    ],
    is_active: true,
    created_at: Date.now()
  },
  {
    package_id: 'PKG_TEST_002_STANDARD',
    service_id: 'SVC_TEST_002',
    name: 'Complete UI/UX Design',
    description: 'Complete UI/UX design for web or mobile app',
    price_e8s: BigInt(600000000), // 6 ICP
    delivery_time_days: 10,
    revisions: 3,
    features: [
      'User research',
      'Wireframing',
      'Up to 15 screens',
      'Interactive prototype',
      'Design system',
      'Usability testing'
    ],
    is_active: true,
    created_at: Date.now()
  }
];

// Export functions
export function getServiceById(serviceId: string): Service | null {
  console.log('🔍 getServiceById called with:', serviceId);
  const result = services.find(service => service.service_id === serviceId) || null;
  console.log('📋 Service found:', result ? 'YES' : 'NO');
  return result;
}

export function getPackageById(packageId: string): Package | null {
  console.log('🔍 getPackageById called with:', packageId);
  console.log('📦 Available packages:', packages.map(p => p.package_id));
  const result = packages.find(pkg => pkg.package_id === packageId) || null;
  console.log('📦 Package found:', result ? 'YES' : 'NO');
  return result;
}

export function getPackagesByServiceId(serviceId: string): Package[] {
  return packages.filter(pkg => pkg.service_id === serviceId && pkg.is_active);
}

export function getAllServices(): Service[] {
  return services.filter(service => service.status === 'Active');
}

export function getAllPackages(): Package[] {
  return packages.filter(pkg => pkg.is_active);
}

export function searchServices(query: string): Service[] {
  const lowerQuery = query.toLowerCase();
  return services.filter(service =>
    service.status === 'Active' && (
      service.title.toLowerCase().includes(lowerQuery) ||
      service.description.toLowerCase().includes(lowerQuery) ||
      service.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  );
}

// Test helper functions
export function getTestServiceIds(): string[] {
  return services.map(s => s.service_id);
}

export function getTestPackageIds(): string[] {
  return packages.map(p => p.package_id);
}