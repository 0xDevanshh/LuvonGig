import { NextRequest, NextResponse } from 'next/server';
import { getCitiesByCountry, getCitiesByCountryAndState } from 'rc-geographic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('countryCode');
    const stateCode = searchParams.get('stateCode');
    const query = searchParams.get('query');

    if (!countryCode) {
      return NextResponse.json({
        success: false,
        error: 'Country code is required',
        cities: [],
      }, { status: 400 });
    }

    let cities;
    if (stateCode) {
      // Get cities for specific state
      cities = getCitiesByCountryAndState(countryCode, stateCode);
    } else {
      // Get all cities for the country (limited to major cities for performance)
      cities = getCitiesByCountry(countryCode);
    }

    // Map the data structure to match what the frontend expects
    const mappedCities = (cities || []).map((city: any) => ({
      id: city.code,
      name: city.name,
      country_code: city.cCode,
      state_code: city.sCode,
      postalCode: city.pCode,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tZone
    }));

    // Sort cities by name
    const sortedCities = mappedCities.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by search query if provided
    let filteredCities = sortedCities;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredCities = sortedCities.filter(city =>
        city.name.toLowerCase().includes(lowerQuery) ||
        city.state_code.toLowerCase().includes(lowerQuery)
      );
    }

    // Limit results for performance
    const limitedCities = filteredCities.slice(0, 500);

    return NextResponse.json({
      success: true,
      cities: limitedCities,
      count: limitedCities.length,
      total: filteredCities.length,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cities',
      cities: [],
    }, { status: 500 });
  }
}