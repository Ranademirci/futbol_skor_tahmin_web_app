const API_BASE = 'https://v3.football.api-sports.io';

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

export async function apiFootballFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.warn('API-Football key not configured. Using empty response.');
    return [];
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  const url = `${API_BASE}/${endpoint}?${searchParams.toString()}`;
  
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse<T> = await res.json();
  return data.response;
}
