import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Syringe, 
  Package, 
  Bell, 
  BarChart3, 
  Plus, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Menu,
  X,
  LogOut,
  UserPlus,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Star,
  Heart,
  Stethoscope,
  User,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import apiFetch from './utils/api';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinate from './pages/Vaccinate';
import Stock from './pages/Stock';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

type Page = 'dashboard' | 'patients' | 'vaccinate' | 'stock' | 'alerts' | 'reports' | 'settings' | 'profile';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'enfermeiro';
  nome_completo: string;
  profile_picture?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'first-access' | 'register'>('login');
  const [tempUsername, setTempUsername] = useState('');

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('vacina_ja_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchNotifications(parsed.id);
      }
    } catch (e) {
      console.error('Error loading user from localStorage:', e);
      localStorage.removeItem('vacina_ja_user');
    }
  }, []);

  const fetchNotifications = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { username, password } = Object.fromEntries(formData);
    
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('vacina_ja_user', JSON.stringify(userData));
        setLoginError('');
      } else {
        setLoginError('Utilizador ou palavra-passe incorretos.');
      }
    } catch (err) {
      setLoginError('Erro ao ligar ao servidor.');
    }
  };

  const handleNavigate = (page: Page, patientId?: number) => {
    setActivePage(page);
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vacina_ja_user');
  };

  const markNotificationRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/read/${id}`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        {/* Background with blurred logo - more visible */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-20">
            <img src="/logo.jpeg" alt="" className="w-full h-full object-contain blur-2xl" />
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/50 via-blue-800/30 to-slate-900/70" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-[480px] relative z-10"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 p-2">
            {/* Logo as watermark in form */}
            <div className="relative rounded-[40px] bg-gradient-to-br from-blue-600 to-blue-700 p-10 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <img src="/logo.jpeg" alt="" className="w-full h-full object-contain blur-sm" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-[32px] shadow-2xl mb-6">
                  <img src="/logo.jpeg" alt="Vacina Já" className="w-20 h-20 object-contain rounded-xl" />
                </div>
                
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase drop-shadow-lg">Vacina Já</h1>
                <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Sistema de Vacinação Amigo • Angola</p>
              </div>
            </div>
            
            <div className="p-8 md:p-10">

              {loginMode === 'login' && (
                <form className="space-y-5 text-left" onSubmit={handleLogin}>
                  {loginError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 flex items-center gap-3"
                    >
                      <AlertCircle size={20} />
                      <span className="font-bold">{loginError}</span>
                    </motion.div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Utilizador</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <User size={20} />
                      </div>
                      <input 
                        name="username"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                        placeholder="ex: enfermeiro"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Palavra-passe</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={20} />
                      </div>
                      <input 
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => setLoginMode('forgot')} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                      Esqueci a minha senha
                    </button>
                    <button type="button" onClick={() => setLoginMode('first-access')} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                      Primeiro Acesso
                    </button>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-tight"
                  >
                    Entrar no Sistema
                  </button>

                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setLoginMode('register')} className="text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
                      Criar Nova Conta
                    </button>
                  </div>
                </form>
              )}

              {loginMode === 'forgot' && (
                <ForgotPasswordForm onBack={() => setLoginMode('login')} />
              )}

              {loginMode === 'first-access' && (
                <FirstAccessForm onBack={() => setLoginMode('login')} onSuccess={(username) => { setTempUsername(username); setLoginMode('login'); }} />
              )}

              {loginMode === 'register' && (
                <RegisterForm onBack={() => setLoginMode('login')} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'patients', label: 'Pacientes', icon: Users, color: 'text-emerald-600' },
    { id: 'vaccinate', label: 'Vacinar', icon: Syringe, color: 'text-rose-600' },
    { id: 'stock', label: 'Estoque', icon: Package, color: 'text-amber-600' },
    { id: 'alerts', label: 'Alertas', icon: Bell, color: 'text-purple-600' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'profile', label: 'Perfil', icon: User, color: 'text-cyan-600' },
    ...(user?.role === 'admin' ? [{ id: 'settings', label: 'Configurações', icon: Lock, color: 'text-slate-600' }] : []),
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'patients': return <Patients />;
      case 'vaccinate': return <Vaccinate patientId={selectedPatientId} onComplete={() => setSelectedPatientId(null)} />;
      case 'stock': return <Stock />;
      case 'alerts': return <Alerts />;
      case 'reports': return <Reports />;
      case 'profile': return <Profile onNavigate={handleNavigate} />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-24'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-[70] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`p-8 flex items-center gap-4 border-b border-slate-100 ${!isSidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 overflow-hidden">
            <img src="/logo.jpeg" alt="Vacina Já" className="w-8 h-8 object-contain" />
          </div>
          {isSidebarOpen && (
            <span className="font-black text-2xl tracking-tight text-slate-900 truncate">VACINA JÁ</span>
          )}
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id as Page);
                if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center transition-all group relative ${
                isSidebarOpen ? 'gap-4 p-4 rounded-2xl' : 'justify-center p-4 rounded-2xl'
              } ${
                activePage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? item.label : ''}
            >
              <item.icon size={26} className={`flex-shrink-0 ${activePage === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600'}`} />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
              {activePage === item.id && isSidebarOpen && (
                <motion.div 
                  layoutId="active-pill"
                  className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${item.color.replace('text-', 'bg-')}`}
                />
              )}
              {!isSidebarOpen && activePage === item.id && (
                <motion.div 
                  layoutId="active-pill-collapsed"
                  className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-3">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center transition-all font-bold text-rose-500 hover:bg-rose-50 rounded-2xl ${
              isSidebarOpen ? 'gap-4 p-4' : 'justify-center p-4'
            }`}
            title={!isSidebarOpen ? 'Sair do Sistema' : ''}
          >
            <LogOut size={26} className="flex-shrink-0" />
            {isSidebarOpen && <span className="truncate">Sair do Sistema</span>}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full flex items-center transition-all text-slate-400 hover:text-slate-900 ${
              isSidebarOpen ? 'gap-4 p-4' : 'justify-center p-4'
            }`}
            title={!isSidebarOpen ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            {isSidebarOpen && <span className="font-medium">Recolher Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-72' : 'lg:ml-24'
        } ml-0`}
      >
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {menuItems.find(m => m.id === activePage)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                title="Ver notificações"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 uppercase text-sm">Notificações</h3>
                    <span className="text-xs text-slate-400">{unreadCount} não lidas</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Sem notificações</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${!notif.read ? 'bg-blue-600' : 'bg-slate-300'}`} />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2">
                                {new Date(notif.created_at).toLocaleString('pt-AO')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <button 
                      onClick={() => { setActivePage('profile'); setShowNotifications(false); }}
                      className="w-full text-center text-sm text-blue-600 font-bold hover:text-blue-700"
                    >
                      Ver todas as notificações
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user.nome_completo}</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.role}</span>
            </div>
            <button 
              onClick={() => handleNavigate('profile')}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner overflow-hidden hover:scale-105 transition-transform"
            >
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.nome_completo} className="w-full h-full object-cover" />
              ) : (
                user.nome_completo.charAt(0)
              )}
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SmilingStar({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
      <circle cx="9" cy="11" r="1" fill="white" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="white" stroke="none" />
      <path d="M9 15c.5 1 1.5 1.5 3 1.5s2.5-.5 3-1.5" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-50 text-[--color-brand-primary] rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// Forgot Password Form Component
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: `Email enviado! Use a senha temporária: ${data.tempPass || 'enviada por email'}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao processar pedido' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5 text-left" onSubmit={handleSubmit}>
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email de Recuperação</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Mail size={20} />
          </div>
          <input 
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">Ser enviado um email com instruções para redefinir a sua senha.</p>

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-tight"
      >
        {loading ? 'A processar...' : 'Enviar Email'}
      </button>

      <button 
        type="button"
        onClick={onBack}
        className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
      >
        ← Voltar ao Login
      </button>
    </form>
  );
}

// First Access Form Component
function FirstAccessForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (username: string) => void }) {
  const [formData, setFormData] = useState({ username: '', tempPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As palavras-passe não coincidem' });
      return;
    }
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await apiFetch('/api/auth/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Conta ativada com sucesso!' });
        setTimeout(() => onSuccess(formData.username), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao ativar conta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Utilizador</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <User size={20} />
          </div>
          <input 
            name="username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="Nome de utilizador"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha Temporária</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Lock size={20} />
          </div>
          <input 
            name="tempPassword"
            type="password"
            required
            value={formData.tempPassword}
            onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="Senha recebida do admin"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Lock size={20} />
          </div>
          <input 
            name="newPassword"
            type="password"
            required
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Lock size={20} />
          </div>
          <input 
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-tight"
      >
        {loading ? 'A ativar...' : 'Ativar Conta'}
      </button>

      <button 
        type="button"
        onClick={onBack}
        className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
      >
        ← Voltar ao Login
      </button>
    </form>
  );
}

// Register Form Component
function RegisterForm({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', nome_completo: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As palavras-passe não coincidem' });
      return;
    }
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Conta criada com sucesso! Pode agora fazer login.' });
        setTimeout(onBack, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao criar conta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <User size={20} />
          </div>
          <input 
            name="nome_completo"
            required
            value={formData.nome_completo}
            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="João Manuel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Mail size={20} />
          </div>
          <input 
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Utilizador</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <User size={20} />
          </div>
          <input 
            name="username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="joao.manuel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Palavra-passe</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Lock size={20} />
          </div>
          <input 
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Palavra-passe</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Lock size={20} />
          </div>
          <input 
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-tight"
      >
        {loading ? 'A criar...' : 'Criar Conta'}
      </button>

      <button 
        type="button"
        onClick={onBack}
        className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
      >
        ← Voltar ao Login
      </button>
    </form>
  );
}

