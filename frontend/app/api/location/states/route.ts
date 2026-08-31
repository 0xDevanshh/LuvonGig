import { NextRequest, NextResponse } from 'next/server';
import { getStatesByCountry } from 'rc-geographic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('countryCode');
    const query = searchParams.get('query');

    if (!countryCode) {
      return NextResponse.json({
        success: false,
        error: 'Country code is required',
        states: [],
      }, { status: 400 });
    }

    let states = getStatesByCountry(countryCode);

    // Map the data structure to match what the frontend expects
    const mappedStates = (states || []).map((state: any) => ({
      id: state.code,
      name: state.name,
      country_code: state.cCode,
      state_code: state.code, // Use the same code as id for state_code
      latitude: state.lat,
      longitude: state.lng
    }));

    // Sort states by name
    const sortedStates = mappedStates.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by search query if provided
    let filteredStates = sortedStates;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredStates = sortedStates.filter(state =>
        state.name.toLowerCase().includes(lowerQuery) ||
        state.state_code.toLowerCase().includes(lowerQuery)
      );
    }

    return NextResponse.json({
      success: true,
      states: filteredStates,
      count: filteredStates.length,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch states',
      states: [],
    }, { status: 500 });
  }
}
