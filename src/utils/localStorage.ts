// src/utils/localStorage.ts - Sistema completo offline via localStorage

// ============ Interfaces ============

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'enfermeiro';
  nome_completo: string;
  email?: string;
  created_at?: string;
}

export interface Patient {
  id: number;
  nome: string;
  data_nascimento: string;
  sexo: 'M' | 'F';
  numero_identificacao: string;
  nome_mae?: string;
  nome_pai?: string;
  telefone?: string;
  endereco?: string;
  municipio?: string;
  provincia?: string;
  gravida?: boolean;
  puerpera?: boolean;
  created_at?: string;
}

export interface StockItem {
  id: number;
  nome: string;
  quantidade: number;
  minStock: number;
  lote?: string;
  validade?: string;
  data_entrada?: string;
  created_at?: string;
}

export interface Vaccination {
  id: number;
  patient_id: number;
  vaccine_id: number;
  vaccine_name: string;
  dose_number: number;
  data_vacinacao: string;
  local_aplicacao: string;
  observacoes?: string;
  enfermeiro_id: number;
  created_at?: string;
}

export interface LocalNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ============ Funções Genéricas de LocalStorage ============

const getFromLocalStorage = (key: string): any => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const saveToLocalStorage = (key: string, data: any): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============ Autenticação ============

const getNextId = (key: string): number => {
  const data = getFromLocalStorage(key);
  if (!data || data.length === 0) return 1;
  return Math.max(...data.map((item: any) => item.id)) + 1;
};

export const initializeLocalStorage = (): void => {
  // Inicializar usuários se não existirem
  if (!localStorage.getItem('vacina_ja_users')) {
    const defaultUsers: User[] = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', nome_completo: 'Administrador do Sistema', email: 'admin@vacinaja.ao' },
      { id: 2, username: 'enfermeiro', password: 'enfermeiro123', role: 'enfermeiro', nome_completo: 'Enfermeiro Padrão', email: 'enfermeiro@vacinaja.ao' },
    ];
    saveToLocalStorage('vacina_ja_users', defaultUsers);
  }

  // Inicializar pacientes
  if (!localStorage.getItem('vacina_ja_patients')) {
    saveToLocalStorage('vacina_ja_patients', []);
  }

  // Inicializar estoque de vacinas
  if (!localStorage.getItem('vacina_ja_stock')) {
    const defaultVaccines: StockItem[] = [
      { id: 1, nome: 'BCG', quantidade: 100, minStock: 20, lote: 'BCG-2024-001', validade: '2025-12-31' },
      { id: 2, nome: 'Hepatite B', quantidade: 100, minStock: 20, lote: 'HB-2024-001', validade: '2025-12-31' },
      { id: 3, nome: 'Poliomielite', quantidade: 100, minStock: 20, lote: 'POLIO-2024-001', validade: '2025-12-31' },
      { id: 4, nome: 'Pentavalente', quantidade: 100, minStock: 20, lote: 'PENTA-2024-001', validade: '2025-12-31' },
      { id: 5, nome: 'Rotavirus', quantidade: 100, minStock: 20, lote: 'ROTA-2024-001', validade: '2025-12-31' },
      { id: 6, nome: 'Pneumococica', quantidade: 100, minStock: 20, lote: 'PNEU-2024-001', validade: '2025-12-31' },
      { id: 7, nome: 'Meningococica', quantidade: 100, minStock: 20, lote: 'MENI-2024-001', validade: '2025-12-31' },
      { id: 8, nome: 'VASPR (Sarampo, Papeira e Rubeola)', quantidade: 100, minStock: 20, lote: 'VASPR-2024-001', validade: '2025-12-31' },
    ];
    saveToLocalStorage('vacina_ja_stock', defaultVaccines);
  }

  // Inicializar histórico de vacinação
  if (!localStorage.getItem('vacina_ja_vaccinations')) {
    saveToLocalStorage('vacina_ja_vaccinations', []);
  }

  // Inicializar notificações
  if (!localStorage.getItem('vacina_ja_notifications')) {
    saveToLocalStorage('vacina_ja_notifications', []);
  }

  console.log('LocalStorage initialized successfully!');
};

export const authenticateUser = (username: string, password: string): User | null => {
  const users = getFromLocalStorage('vacina_ja_users') || [];
  const user = users.find((u: User) => u.username === username && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    // Save session
    saveToLocalStorage('vacina_ja_session', userWithoutPassword);
    return userWithoutPassword as User;
  }
  return null;
};

export const getCurrentSession = (): User | null => {
  return getFromLocalStorage('vacina_ja_session');
};

export const clearSession = (): void => {
  localStorage.removeItem('vacina_ja_session');
};

export const registerUser = (userData: Partial<User>): User | null => {
  const users = getFromLocalStorage('vacina_ja_users') || [];
  
  // Check if username already exists
  if (users.some((u: User) => u.username === userData.username)) {
    return null;
  }

  const newUser: User = {
    id: getNextId('vacina_ja_users'),
    username: userData.username || '',
    password: userData.password || '',
    role: userData.role || 'enfermeiro',
    nome_completo: userData.nome_completo || '',
    email: userData.email || '',
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveToLocalStorage('vacina_ja_users', users);
  
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
};

// ============ Pacientes ============

export const patients = {
  getAll: (): Patient[] => {
    return getFromLocalStorage('vacina_ja_patients') || [];
  },

  getById: (id: number): Patient | null => {
    const patientsData = getFromLocalStorage('vacina_ja_patients') || [];
    return patientsData.find((p: Patient) => p.id === id) || null;
  },

  add: (patient: Partial<Patient>): Patient => {
    const patientsData = getFromLocalStorage('vacina_ja_patients') || [];
    const newPatient: Patient = {
      id: getNextId('vacina_ja_patients'),
      nome: patient.nome || '',
      data_nascimento: patient.data_nascimento || '',
      sexo: patient.sexo || 'M',
      numero_identificacao: patient.numero_identificacao || '',
      nome_mae: patient.nome_mae || '',
      nome_pai: patient.nome_pai || '',
      telefone: patient.telefone || '',
      endereco: patient.endereco || '',
      municipio: patient.municipio || '',
      provincia: patient.provincia || '',
      gravida: patient.gravida || false,
      puerpera: patient.puerpera || false,
      created_at: new Date().toISOString(),
    };
    patientsData.push(newPatient);
    saveToLocalStorage('vacina_ja_patients', patientsData);
    return newPatient;
  },

  update: (id: number, patient: Partial<Patient>): Patient | null => {
    const patientsData = getFromLocalStorage('vacina_ja_patients') || [];
    const index = patientsData.findIndex((p: Patient) => p.id === id);
    if (index === -1) return null;
    
    patientsData[index] = { ...patientsData[index], ...patient };
    saveToLocalStorage('vacina_ja_patients', patientsData);
    return patientsData[index];
  },

  delete: (id: number): boolean => {
    const patientsData = getFromLocalStorage('vacina_ja_patients') || [];
    const filtered = patientsData.filter((p: Patient) => p.id !== id);
    if (filtered.length === patientsData.length) return false;
    saveToLocalStorage('vacina_ja_patients', filtered);
    return true;
  },

  search: (query: string): Patient[] => {
    const patientsData = getFromLocalStorage('vacina_ja_patients') || [];
    const lowerQuery = query.toLowerCase();
    return patientsData.filter((p: Patient) => 
      p.nome.toLowerCase().includes(lowerQuery) ||
      (p.numero_identificacao && p.numero_identificacao.toLowerCase().includes(lowerQuery))
    );
  },
};

// ============ Estoque de Vacinas ============

export const stock = {
  getAll: (): StockItem[] => {
    return getFromLocalStorage('vacina_ja_stock') || [];
  },

  getById: (id: number): StockItem | null => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    return stockData.find((s: StockItem) => s.id === id) || null;
  },

  add: (item: Partial<StockItem>): StockItem => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    const newItem: StockItem = {
      id: getNextId('vacina_ja_stock'),
      nome: item.nome || '',
      quantidade: item.quantidade || 0,
      minStock: item.minStock || 20,
      lote: item.lote || '',
      validade: item.validade || '',
      data_entrada: item.data_entrada || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    stockData.push(newItem);
    saveToLocalStorage('vacina_ja_stock', stockData);
    return newItem;
  },

  update: (id: number, item: Partial<StockItem>): StockItem | null => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    const index = stockData.findIndex((s: StockItem) => s.id === id);
    if (index === -1) return null;
    
    stockData[index] = { ...stockData[index], ...item };
    saveToLocalStorage('vacina_ja_stock', stockData);
    return stockData[index];
  },

  delete: (id: number): boolean => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    const filtered = stockData.filter((s: StockItem) => s.id !== id);
    if (filtered.length === stockData.length) return false;
    saveToLocalStorage('vacina_ja_stock', filtered);
    return true;
  },

  decreaseQuantity: (id: number, amount: number = 1): boolean => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    const index = stockData.findIndex((s: StockItem) => s.id === id);
    if (index === -1) return false;
    
    if (stockData[index].quantidade < amount) return false;
    
    stockData[index].quantidade -= amount;
    saveToLocalStorage('vacina_ja_stock', stockData);
    return true;
  },

  getLowStock: (): StockItem[] => {
    const stockData = getFromLocalStorage('vacina_ja_stock') || [];
    return stockData.filter((s: StockItem) => s.quantidade <= s.minStock);
  },
};

// ============ Vacinações ============

export const vaccinations = {
  getAll: (): Vaccination[] => {
    return getFromLocalStorage('vacina_ja_vaccinations') || [];
  },

  getByPatientId: (patientId: number): Vaccination[] => {
    const vaccData = getFromLocalStorage('vacina_ja_vaccinations') || [];
    return vaccData.filter((v: Vaccination) => v.patient_id === patientId);
  },

  add: (vaccination: Partial<Vaccination>): Vaccination => {
    const vaccData = getFromLocalStorage('vacina_ja_vaccinations') || [];
    const newVaccination: Vaccination = {
      id: getNextId('vacina_ja_vaccinations'),
      patient_id: vaccination.patient_id || 0,
      vaccine_id: vaccination.vaccine_id || 0,
      vaccine_name: vaccination.vaccine_name || '',
      dose_number: vaccination.dose_number || 1,
      data_vacinacao: vaccination.data_vacinacao || new Date().toISOString(),
      local_aplicacao: vaccination.local_aplicacao || 'Posto de Saúde',
      observacoes: vaccination.observacoes || '',
      enfermeiro_id: vaccination.enfermeiro_id || 0,
      created_at: new Date().toISOString(),
    };
    vaccData.push(newVaccination);
    saveToLocalStorage('vacina_ja_vaccinations', vaccData);
    
    // Decrease stock
    stock.decreaseQuantity(vaccination.vaccine_id || 0, 1);
    
    return newVaccination;
  },

  delete: (id: number): boolean => {
    const vaccData = getFromLocalStorage('vacina_ja_vaccinations') || [];
    const filtered = vaccData.filter((v: Vaccination) => v.id !== id);
    if (filtered.length === vaccData.length) return false;
    saveToLocalStorage('vacina_ja_vaccinations', filtered);
    return true;
  },
};

// ============ Notificações ============

export const notifications = {
  getAll: (userId?: number): LocalNotification[] => {
    const notifData = getFromLocalStorage('vacina_ja_notifications') || [];
    if (userId) {
      return notifData.filter((n: LocalNotification) => n.user_id === userId);
    }
    return notifData;
  },

  add: (notification: Partial<LocalNotification>): LocalNotification => {
    const notifData = getFromLocalStorage('vacina_ja_notifications') || [];
    const newNotification: LocalNotification = {
      id: getNextId('vacina_ja_notifications'),
      user_id: notification.user_id || 0,
      title: notification.title || '',
      message: notification.message || '',
      read: false,
      created_at: new Date().toISOString(),
    };
    notifData.push(newNotification);
    saveToLocalStorage('vacina_ja_notifications', notifData);
    return newNotification;
  },

  markRead: (id: number): void => {
    const notifData = getFromLocalStorage('vacina_ja_notifications') || [];
    const index = notifData.findIndex((n: LocalNotification) => n.id === id);
    if (index !== -1) {
      notifData[index].read = true;
      saveToLocalStorage('vacina_ja_notifications', notifData);
    }
  },

  markAllRead: (userId: number): void => {
    const notifData = getFromLocalStorage('vacina_ja_notifications') || [];
    notifData.forEach((n: LocalNotification) => {
      if (n.user_id === userId) {
        n.read = true;
      }
    });
    saveToLocalStorage('vacina_ja_notifications', notifData);
  },

  delete: (id: number): boolean => {
    const notifData = getFromLocalStorage('vacina_ja_notifications') || [];
    const filtered = notifData.filter((n: LocalNotification) => n.id !== id);
    if (filtered.length === notifData.length) return false;
    saveToLocalStorage('vacina_ja_notifications', filtered);
    return true;
  },
};

// ============ Estatísticas do Dashboard ============

export const getDashboardStats = () => {
  const allPatients = patients.getAll();
  const allVaccinations = vaccinations.getAll();
  const allStock = stock.getAll();
  
  const today = new Date().toISOString().split('T')[0];
  const todayVaccs = allVaccinations.filter((v: Vaccination) => 
    v.data_vacinacao && v.data_vacinacao.startsWith(today)
  );
  
  const uniquePatientIds = [...new Set(todayVaccs.map((v: Vaccination) => v.patient_id))];
  
  const lowStockItems = stock.getLowStock();
  
  return {
    totalPacientes: allPatients.length,
    totalVacinacoes: allVaccinations.length,
    vacinacoesHoje: todayVaccs.length,
    pacientesHoje: uniquePatientIds.length,
    frascosAbertos: allStock.filter((s: StockItem) => s.quantidade > 0).length,
    alertasStock: lowStockItems.length,
    stockItems: allStock,
  };
};

// ============ localStorageService (API offline) ============

export const localStorageService = {
  auth: {
    login: (username: string, password: string) => authenticateUser(username, password),
    register: (userData: Partial<User>) => registerUser(userData),
    getSession: () => getCurrentSession(),
    clearSession: () => clearSession(),
  },
  patients: {
    getAll: () => patients.getAll(),
    getById: (id: number) => patients.getById(id),
    add: (patient: Partial<Patient>) => patients.add(patient),
    update: (id: number, patient: Partial<Patient>) => patients.update(id, patient),
    delete: (id: number) => patients.delete(id),
    search: (query: string) => patients.search(query),
  },
  stock: {
    getAll: () => stock.getAll(),
    getById: (id: number) => stock.getById(id),
    add: (item: Partial<StockItem>) => stock.add(item),
    update: (id: number, item: Partial<StockItem>) => stock.update(id, item),
    delete: (id: number) => stock.delete(id),
    decreaseQuantity: (id: number, amount: number) => stock.decreaseQuantity(id, amount),
    getLowStock: () => stock.getLowStock(),
  },
  vaccinations: {
    getAll: () => vaccinations.getAll(),
    getByPatientId: (patientId: number) => vaccinations.getByPatientId(patientId),
    add: (vaccination: Partial<Vaccination>) => vaccinations.add(vaccination),
    delete: (id: number) => vaccinations.delete(id),
  },
  notifications: {
    getAll: (userId?: number) => notifications.getAll(userId),
    add: (notification: Partial<LocalNotification>) => notifications.add(notification),
    markRead: (id: number) => notifications.markRead(id),
    markAllRead: (userId: number) => notifications.markAllRead(userId),
    delete: (id: number) => notifications.delete(id),
  },
  stats: () => getDashboardStats(),
};

export default localStorageService;

// ============ Funções de compatibilidade ============

export const getUsers = () => getFromLocalStorage('vacina_ja_users') || [];
export const saveUsers = (users: User[]) => saveToLocalStorage('vacina_ja_users', users);
export const getPatients = () => patients.getAll();
export const savePatients = (patientsData: Patient[]) => saveToLocalStorage('vacina_ja_patients', patientsData);
export const getVaccineStock = () => stock.getAll();
export const saveVaccineStock = (stockItems: StockItem[]) => saveToLocalStorage('vacina_ja_stock', stockItems);
export const getVaccinationHistory = () => vaccinations.getAll();
export const saveVaccinationHistory = (history: Vaccination[]) => saveToLocalStorage('vacina_ja_vaccinations', history);
