// API Base URL - automatically uses environment variable in production
// For Vercel deployment with external backend, set VITE_API_BASE_URL in Vercel dashboard

const getApiBaseUrl = (): string => {
  // @ts-ignore
  return import.meta.env.VITE_API_BASE_URL || '';
};

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  return response;
};

export default apiFetch;
