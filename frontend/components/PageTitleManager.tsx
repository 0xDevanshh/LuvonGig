'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const STATIC_TITLES: Record<string, string> = {
  '/': 'Home | Workbudd',
  '/login': 'Login | Workbudd',
  '/signup': 'Sign Up | Workbudd',
  '/freelancer/dashboard': 'Dashboard | Freelancer | Workbudd',
  '/freelancer/my-services': 'My Services | Freelancer | Workbudd',
  '/freelancer/analytics': 'Analytics | Freelancer | Workbudd',
  '/freelancer/projects': 'Projects | Freelancer | Workbudd',
  '/client/dashboard': 'Dashboard | Client | Workbudd',
  '/client/browse-services': 'Browse Services | Client | Workbudd',
  '/client/my-projects': 'My Projects | Client | Workbudd',
};

const DYNAMIC_RULES: Array<{ test: RegExp; title: string }> = [
  {
    test: /^\/freelancer\/update-service\//,
    title: 'Update Service | Freelancer | Workbudd',
  },
  {
    test: /^\/freelancer\/service-preview\//,
    title: 'Service Preview | Freelancer | Workbudd',
  },
  {
    test: /^\/freelancer\/add-service/,
    title: 'Add Service | Freelancer | Workbudd',
  },
  {
    test: /^\/client\/service\//,
    title: 'Service Details | Client | Workbudd',
  },
  {
    test: /^\/client\/payment\//,
    title: 'Payment | Client | Workbudd',
  },
];

const fallbackTitle = (pathname: string) => {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    );

  if (segments.length === 0) {
    return 'Workbudd';
  }

  return `${segments.join(' | ')} | Workbudd`;
};

export function PageTitleManager() {
  const pathname = usePathname();

  const resolvedTitle = useMemo(() => {
    if (!pathname) {
      return 'Workbudd';
    }

    if (STATIC_TITLES[pathname]) {
      return STATIC_TITLES[pathname];
    }

    const matchedRule = DYNAMIC_RULES.find((rule) =>
      rule.test.test(pathname),
    );
    if (matchedRule) {
      return matchedRule.title;
    }

    return fallbackTitle(pathname);
  }, [pathname]);

  useEffect(() => {
    if (resolvedTitle) {
      document.title = resolvedTitle;
    }
  }, [resolvedTitle]);

  return null;
}

