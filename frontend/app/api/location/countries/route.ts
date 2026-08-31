import { NextRequest, NextResponse } from 'next/server';
import { getAllCountries } from 'rc-geographic';

// Emoji mapping for countries
function getCountryEmoji(countryCode: string): string {
  const flagMap: { [key: string]: string } = {
    'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'JP': '🇯🇵', 'CN': '🇨🇳',
    'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'RU': '🇷🇺', 'KR': '🇰🇷',
    'ZA': '🇿🇦', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹',
    'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱',
    'GR': '🇬🇷', 'PT': '🇵🇹', 'IE': '🇮🇪', 'NZ': '🇳🇿', 'AF': '🇦🇫',
    'AL': '🇦🇱', 'DZ': '🇩🇿', 'AS': '🇦🇸', 'AD': '🇦🇩', 'AO': '🇦🇴',
    'AI': '🇦🇮', 'AQ': '🇦🇶', 'AG': '🇦🇬', 'AR': '🇦🇷', 'AM': '🇦🇲',
    'AW': '🇦🇼', 'AZ': '🇦🇿', 'BS': '🇧🇸', 'BH': '🇧🇭', 'BD': '🇧🇩',
    'BB': '🇧🇧', 'BY': '🇧🇾', 'BZ': '🇧🇿', 'BJ': '🇧🇯', 'BM': '🇧🇲',
    'BT': '🇧🇹', 'BO': '🇧🇴', 'BA': '🇧🇦', 'BW': '🇧🇼', 'BV': '🇧🇻',
    'IO': '🇮🇴', 'BN': '🇧🇳', 'BG': '🇧🇬', 'BF': '🇧🇫', 'BI': '🇧🇮',
    'KH': '🇰🇭', 'CM': '🇨🇲', 'CV': '🇨🇻', 'KY': '🇰🇾', 'CF': '🇨🇫',
    'TD': '🇹🇩', 'CL': '🇨🇱', 'CX': '🇨🇽', 'CC': '🇨🇨', 'CO': '🇨🇴',
    'KM': '🇰🇲', 'CG': '🇨🇬', 'CD': '🇨🇩', 'CK': '🇨🇰', 'CR': '🇨🇷',
    'CI': '🇨🇮', 'HR': '🇭🇷', 'CU': '🇨🇺', 'CY': '🇨🇾', 'CZ': '🇨🇿',
    'DJ': '🇩🇯', 'DM': '🇩🇲', 'DO': '🇩🇴', 'EC': '🇪🇨', 'EG': '🇪🇬',
    'SV': '🇸🇻', 'GQ': '🇬🇶', 'ER': '🇪🇷', 'EE': '🇪🇪', 'ET': '🇪🇹',
    'FK': '🇫🇰', 'FO': '🇫🇴', 'FJ': '🇫🇯', 'GF': '🇬🇫', 'PF': '🇵🇫',
    'TF': '🇹🇫', 'GA': '🇬🇦', 'GM': '🇬🇲', 'GE': '🇬🇪', 'GH': '🇬🇭',
    'GI': '🇬🇮', 'GL': '🇬🇱', 'GD': '🇬🇩', 'GP': '🇬🇵', 'GU': '🇬🇺',
    'GT': '🇬🇹', 'GN': '🇬🇳', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HT': '🇭🇹',
    'HM': '🇭🇲', 'VA': '🇻🇦', 'HN': '🇭🇳', 'HK': '🇭🇰', 'HU': '🇭🇺',
    'IS': '🇮🇸', 'ID': '🇮🇩', 'IR': '🇮🇷', 'IQ': '🇮🇶', 'IL': '🇮🇱',
    'JM': '🇯🇲', 'JO': '🇯🇴', 'KZ': '🇰🇿', 'KE': '🇰🇪', 'KI': '🇰🇮',
    'KP': '🇰🇵', 'KW': '🇰🇼', 'KG': '🇰🇬', 'LA': '🇱🇦', 'LV': '🇱🇻',
    'LB': '🇱🇧', 'LS': '🇱🇸', 'LR': '🇱🇷', 'LY': '🇱🇾', 'LI': '🇱🇮',
    'LT': '🇱🇹', 'LU': '🇱🇺', 'MO': '🇲🇴', 'MK': '🇲🇰', 'MG': '🇲🇬',
    'MW': '🇲🇼', 'MY': '🇲🇾', 'MV': '🇲🇻', 'ML': '🇲🇱', 'MT': '🇲🇹',
    'MH': '🇲🇭', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MU': '🇲🇺', 'YT': '🇾🇹',
    'FM': '🇫🇲', 'MD': '🇲🇩', 'MC': '🇲🇨', 'MN': '🇲🇳', 'MS': '🇲🇸',
    'MA': '🇲🇦', 'MZ': '🇲🇿', 'MM': '🇲🇲', 'NA': '🇳🇦', 'NR': '🇳🇷',
    'NP': '🇳🇵', 'AN': '🇦🇳', 'NC': '🇳🇨', 'NI': '🇳🇮', 'NE': '🇳🇪',
    'NU': '🇳🇺', 'NF': '🇳🇫', 'MP': '🇲🇵', 'OM': '🇴🇲', 'PK': '🇵🇰',
    'PW': '🇵🇼', 'PS': '🇵🇸', 'PA': '🇵🇦', 'PG': '🇵🇬', 'PY': '🇵🇾',
    'PE': '🇵🇪', 'PH': '🇵🇭', 'PN': '🇵🇳', 'PR': '🇵🇷', 'QA': '🇶🇦',
    'RE': '🇷🇪', 'RO': '🇷🇴', 'RW': '🇷🇼', 'SH': '🇸🇭', 'KN': '🇰🇳',
    'LC': '🇱🇨', 'PM': '🇵🇲', 'VC': '🇻🇨', 'WS': '🇼🇸', 'SM': '🇸🇲',
    'ST': '🇸🇹', 'SA': '🇸🇦', 'SN': '🇸🇳', 'CS': '🇨🇸', 'SC': '🇸🇨',
    'SL': '🇸🇱', 'SG': '🇸🇬', 'SK': '🇸🇰', 'SI': '🇸🇮', 'SB': '🇸🇧',
    'SO': '🇸🇴', 'GS': '🇬🇸', 'LK': '🇱🇰', 'SD': '🇸🇩', 'SR': '🇸🇷',
    'SJ': '🇸🇯', 'SZ': '🇸🇿', 'SY': '🇸🇾', 'TW': '🇹🇼', 'TJ': '🇹🇯',
    'TZ': '🇹🇿', 'TH': '🇹🇭', 'TL': '🇹🇱', 'TG': '🇹🇬', 'TK': '🇹🇰',
    'TO': '🇹🇴', 'TT': '🇹🇹', 'TN': '🇹🇳', 'TR': '🇹🇷', 'TM': '🇹🇲',
    'TC': '🇹🇨', 'TV': '🇹🇻', 'UG': '🇺🇬', 'UA': '🇺🇦', 'AE': '🇦🇪',
    'UM': '🇺🇲', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VU': '🇻🇺', 'VE': '🇻🇪',
    'VN': '🇻🇳', 'VG': '🇻🇬', 'VI': '🇻🇮', 'WF': '🇼🇫', 'EH': '🇪🇭',
    'YE': '🇾🇪', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
  };
  return flagMap[countryCode] || '🌍';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let countries = getAllCountries();
    console.log('Countries loaded:', countries.length);

    // Map the data structure to match what the frontend expects
    countries = countries.map((country: any) => ({
      id: country.isoNumeric,
      name: country.name,
      iso2: country.iso2,
      iso3: country.iso3,
      isoNumeric: country.isoNumeric,
      emoji: getCountryEmoji(country.iso2), // Add emoji mapping
      phoneCode: country.phoneCode,
      continent: country.continent,
      capital: country.capital,
      currency: country.currency
    }));

    // Sort countries by name
    countries = countries.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      countries = countries.filter(country =>
        country.name.toLowerCase().includes(lowerQuery) ||
        country.iso2.toLowerCase().includes(lowerQuery) ||
        country.iso3.toLowerCase().includes(lowerQuery)
      );
    }

    // Get popular countries
    const popularCodes = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR', 'MX'];
    const popularCountries = countries.filter(country => popularCodes.includes(country.iso2));

    return NextResponse.json({
      success: true,
      countries,
      popularCountries,
      count: countries.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch countries',
      countries: [],
      popularCountries: [],
      count: 0,
    }, { status: 500 });
  }
}