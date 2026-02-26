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
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinate from './pages/Vaccinate';
import Stock from './pages/Stock';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

type Page = 'dashboard' | 'patients' | 'vaccinate' | 'stock' | 'alerts' | 'reports' | 'settings';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'enfermeiro';
  nome_completo: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { username, password } = Object.fromEntries(formData);
    
    try {
      const res = await fetch('/api/auth/login', {
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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vacina_ja_user');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-[480px] relative z-10"
        >
          <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-white">
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-[32px] text-white shadow-2xl shadow-blue-600/30 mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <SmilingStar size={48} />
              </div>
              
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Vacina Já</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10">Sistema de Vacinação Amigo • Angola</p>

              <form className="space-y-6 text-left" onSubmit={handleLogin}>
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
                      <Users size={20} />
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

                <button 
                  type="submit"
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-tight"
                >
                  Entrar no Sistema
                </button>
              </form>
            </div>
            
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Ministério da Saúde • República de Angola
              </p>
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
    ...(user?.role === 'admin' ? [{ id: 'settings', label: 'Configurações', icon: Lock, color: 'text-slate-600' }] : []),
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'patients': return <Patients />;
      case 'vaccinate': return <Vaccinate />;
      case 'stock': return <Stock />;
      case 'alerts': return <Alerts />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setActivePage} />;
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
        <div className="p-8 flex items-center gap-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <SmilingStar size={24} />
          </div>
          {isSidebarOpen && (
            <span className="font-black text-2xl tracking-tight text-slate-900">VACINA JÁ</span>
          )}
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as Page)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                activePage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={24} className={activePage === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600'} />
              {isSidebarOpen && <span>{item.label}</span>}
              {activePage === item.id && isSidebarOpen && (
                <motion.div 
                  layoutId="active-pill"
                  className={`ml-auto w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold"
          >
            <LogOut size={24} />
            {isSidebarOpen && <span>Sair do Sistema</span>}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-slate-900 transition-all"
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
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user.nome_completo}</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.role}</span>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
              {user.nome_completo.charAt(0)}
            </div>
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

