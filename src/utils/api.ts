// API Base URL - automatically uses environment variable in production
// For Vercel deployment with external backend, set VITE_API_BASE_URL in Vercel dashboard

import localStorageService, { StockItem, Patient, Vaccination, LocalNotification } from './localStorage';

const getApiBaseUrl = (): string => {
  // First check VITE_API_BASE_URL, then check API_BASE_URL
  // @ts-ignore
  return import.meta.env.VITE_API_BASE_URL || (import.meta.env.API_BASE_URL as string) || '';
};

// Check if backend is available
let backendAvailable: boolean | null = null;

export async function checkBackendAvailability(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    backendAvailable = false;
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    return response.ok;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
}

// Force offline mode
export function forceOfflineMode(): void {
  backendAvailable = false;
}

// Force online mode (retry backend connection)
export async function forceOnlineMode(): Promise<boolean> {
  backendAvailable = null;
  return checkBackendAvailability();
}

// Check if we should use offline mode
export function isOffline(): boolean {
  const baseUrl = getApiBaseUrl();
  return !baseUrl || backendAvailable === false;
}

// Mock response for offline mode
function createMockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response;
}

// Handle API errors and fallback to local storage
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  
  // If no backend URL, use offline mode immediately
  if (!baseUrl) {
    return handleOfflineRequest(endpoint, options);
  }
  
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      return handleOfflineRequest(endpoint, options);
    }
    
    backendAvailable = true;
    return response;
  } catch (error) {
    backendAvailable = false;
    return handleOfflineRequest(endpoint, options);
  }
};

// Handle offline requests using local storage
async function handleOfflineRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const method = options?.method || 'GET';
  let body = null;
  
  if (options?.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      body = null;
    }
  }
  
  // Auth endpoints
  if (endpoint === '/api/auth/login' && method === 'POST' && body) {
    const { username, password } = body;
    const user = localStorageService.auth.login(username as string, password as string);
    if (user) {
      return createMockResponse(user);
    }
    return createMockResponse({ error: 'Invalid credentials' }, 401);
  }
  
  if (endpoint === '/api/auth/register' && method === 'POST' && body) {
    const user = localStorageService.auth.register(body);
    if (user) {
      return createMockResponse(user);
    }
    return createMockResponse({ error: 'Username already exists' }, 400);
  }
  
  // Patients endpoints (both /api/patients and /api/pacientes)
  if (endpoint.startsWith('/api/pacientes') || endpoint.startsWith('/api/patients')) {
    // Handle query parameter for search
    const queryMatch = endpoint.match(/\?q=(.+)$/);
    let patients = localStorageService.patients.getAll();
    
    if (queryMatch && queryMatch[1]) {
      const query = decodeURIComponent(queryMatch[1]).toLowerCase();
      patients = patients.filter((p: Patient) => 
        p.nome.toLowerCase().includes(query) || 
        (p.numero_identificacao && p.numero_identificacao.toLowerCase().includes(query))
      );
    }
    
    if (method === 'GET') {
      return createMockResponse(patients);
    }
    if (method === 'POST') {
      const patient = localStorageService.patients.add(body);
      return createMockResponse(patient);
    }
    const idMatch = endpoint.match(/\/(?:pacientes|patients)(\/(\d+))?/);
    const id = idMatch ? idMatch[2] : null;
    if (id && !isNaN(parseInt(id))) {
      if (method === 'PUT') {
        const patient = localStorageService.patients.update(parseInt(id), body);
        return patient ? createMockResponse(patient) : createMockResponse({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        const success = localStorageService.patients.delete(parseInt(id));
        return success ? createMockResponse({ success: true }) : createMockResponse({ error: 'Not found' }, 404);
      }
    }
  }
  
  // Vaccines endpoints (both /api/vacinas and from stock)
  if (endpoint === '/api/vacinas' && method === 'GET') {
    const stock = localStorageService.stock.getAll();
    // Convert stock items to vaccine format
    const vaccines = stock.map((item: StockItem) => ({
      id: item.id,
      nome: item.nome,
      doses_por_frasco: 10,
      prazo_uso_horas: 6,
      grupo_alvo: 'Geral',
      total_doses_esquema: 1
    }));
    return createMockResponse(vaccines);
  }
  
  // Delete vaccine
  if (endpoint.startsWith('/api/vacinas/') && method === 'DELETE') {
    const id = endpoint.split('/').pop();
    if (id && !isNaN(parseInt(id))) {
      const success = localStorageService.stock.delete(parseInt(id));
      return success ? createMockResponse({ success: true }) : createMockResponse({ error: 'Not found' }, 404);
    }
  }
  
  // Stock entry endpoints
  if (endpoint === '/api/stock/entrada' && method === 'POST') {
    const item = localStorageService.stock.add(body);
    return createMockResponse(item);
  }
  
  // Stock history - return empty for offline
  if (endpoint === '/api/stock/history') {
    return createMockResponse([]);
  }
  
  // Users endpoints
  if (endpoint.startsWith('/api/users')) {
    if (method === 'GET') {
      const users = JSON.parse(localStorage.getItem('vacina_ja_users') || '[]');
      // Remove passwords
      const usersWithoutPassword = users.map((u: { password: string }) => { const { password, ...rest } = u; return rest; });
      return createMockResponse(usersWithoutPassword);
    }
    const idMatch = endpoint.match(/\/users\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    if (id && !isNaN(parseInt(id))) {
      if (method === 'DELETE') {
        return createMockResponse({ success: true });
      }
    }
  }
  
  // User profile endpoints
  if (endpoint.startsWith('/api/users/profile')) {
    if (method === 'GET') {
      const idMatch = endpoint.match(/\/profile\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      if (id) {
        const users = JSON.parse(localStorage.getItem('vacina_ja_users') || '[]');
        const user = users.find((u: { id: number }) => u.id === parseInt(id));
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return createMockResponse(userWithoutPassword);
        }
      }
    }
    if (method === 'PUT') {
      const idMatch = endpoint.match(/\/profile\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      if (id) {
        const users = JSON.parse(localStorage.getItem('vacina_ja_users') || '[]');
        const index = users.findIndex((u: { id: number }) => u.id === parseInt(id));
        if (index !== -1) {
          users[index] = { ...users[index], ...body };
          localStorage.setItem('vacina_ja_users', JSON.stringify(users));
          const { password, ...userWithoutPassword } = users[index];
          return createMockResponse(userWithoutPassword);
        }
      }
    }
  }
  
  // Admin endpoints (for administering vaccines)
  if (endpoint === '/api/administrar' && method === 'POST') {
    // Get vaccine name from stock
    const stock = localStorageService.stock.getAll();
    const vaccine = stock.find((v: StockItem) => v.id === body.vaccina_id);
    const vaccineName = vaccine ? vaccine.nome : 'Vacina Desconhecida';
    
    // Convert the request body to match our Vaccination interface
    const vaccinationData = {
      patient_id: body.paciente_id,
      vaccine_id: body.vaccina_id,
      vaccine_name: vaccineName,
      dose_number: 1,
      data_vacinacao: new Date().toISOString(),
      local_aplicacao: 'Posto de Saúde',
      observacoes: body.observacoes || '',
      enfermeiro_id: body.user_id,
    };
    const vaccination = localStorageService.vaccinations.add(vaccinationData);
    return createMockResponse(vaccination);
  }
  
  // Stock endpoints
  if (endpoint.startsWith('/api/stock')) {
    if (method === 'GET') {
      const stock = localStorageService.stock.getAll();
      return createMockResponse(stock);
    }
    if (method === 'POST') {
      const item = localStorageService.stock.add(body);
      return createMockResponse(item);
    }
    const idMatch = endpoint.match(/\/stock\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    if (id && !isNaN(parseInt(id))) {
      if (method === 'PUT') {
        const item = localStorageService.stock.update(parseInt(id), body);
        return item ? createMockResponse(item) : createMockResponse({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        const success = localStorageService.stock.delete(parseInt(id));
        return success ? createMockResponse({ success: true }) : createMockResponse({ error: 'Not found' }, 404);
      }
    }
  }
  
  // Stock endpoints
  if (endpoint.startsWith('/api/stock')) {
    if (method === 'GET') {
      const stock = localStorageService.stock.getAll();
      return createMockResponse(stock);
    }
    if (method === 'POST') {
      const item = localStorageService.stock.add(body);
      return createMockResponse(item);
    }
    const id = endpoint.split('/').pop();
    if (id && !isNaN(parseInt(id))) {
      if (method === 'PUT') {
        const item = localStorageService.stock.update(parseInt(id), body);
        return item ? createMockResponse(item) : createMockResponse({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        const success = localStorageService.stock.delete(parseInt(id));
        return success ? createMockResponse({ success: true }) : createMockResponse({ error: 'Not found' }, 404);
      }
    }
  }
  
  // Vaccinations endpoints
  if (endpoint.startsWith('/api/vaccinations')) {
    if (method === 'GET') {
      const vaccinations = localStorageService.vaccinations.getAll();
      return createMockResponse(vaccinations);
    }
    if (method === 'POST') {
      const vaccination = localStorageService.vaccinations.add(body);
      return createMockResponse(vaccination);
    }
  }
  
  // Notifications endpoints
  if (endpoint.startsWith('/api/notifications')) {
    if (endpoint.includes('/read/') && method === 'PUT') {
      const id = endpoint.split('/').pop();
      if (id) {
        localStorageService.notifications.markRead(parseInt(id));
        return createMockResponse({ success: true });
      }
    }
    const userId = endpoint.split('/').pop();
    if (userId && !isNaN(parseInt(userId))) {
      const notifications = localStorageService.notifications.getAll(parseInt(userId));
      return createMockResponse(notifications);
    }
  }
  
  // Dashboard stats
  if (endpoint === '/api/dashboard/stats') {
    const stats = localStorageService.stats();
    return createMockResponse(stats);
  }
  
  // Stock abertos (open vials)
  if (endpoint === '/api/stock/abertos') {
    const stock = localStorageService.stock.getAll().filter((item: StockItem) => item.quantidade > 0);
    return createMockResponse(stock);
  }
  
  // Appointments (today) - return empty for offline
  if (endpoint === '/api/agendamentos/today') {
    return createMockResponse([]);
  }
  
  // Default: return empty array for unknown endpoints
  return createMockResponse([]);
}

export default apiFetch;
