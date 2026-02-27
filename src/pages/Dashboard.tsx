import React, { useEffect, useState } from 'react';
import {
  Syringe,
  Users,
  Package,
  Bell,
  Clock,
  AlertCircle,
  ChevronRight,
  Play,
  FileText,
  TrendingUp,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { localStorageService, StockItem, Vaccination, Patient } from '../utils/localStorage';

interface Stats {
  dosesHoje: number;
  pacientesHoje: number;
  frascosAbertos: number;
  alertasPendentes: number;
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: any, patientId?: number) => void }) {
  const [stats, setStats] = useState<Stats>({ dosesHoje: 0, pacientesHoje: 0, frascosAbertos: 0, alertasPendentes: 0 });
  const [stock, setStock] = useState<StockItem[]>([]);
  const [recentVaccinations, setRecentVaccinations] = useState<Vaccination[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    try {
      // Get data from localStorage
      const allStock = localStorageService.stock.getAll();
      const allVaccinations = localStorageService.vaccinations.getAll();
      const allPatients = localStorageService.patients.getAll();
      
      // Calculate today's vaccinations
      const today = new Date().toISOString().split('T')[0];
      const todayVaccinations = allVaccinations.filter((v: Vaccination) => 
        v.data_vacinacao && v.data_vacinacao.startsWith(today)
      );
      
      // Get unique patients vaccinated today
      const uniquePatientIds = [...new Set(todayVaccinations.map((v: Vaccination) => v.patient_id))];
      
      // Calculate low stock items
      const lowStock = allStock.filter((item: StockItem) => item.quantidade < 20).length;
      
      // Calculate total doses in stock
      const totalDoses = allStock.reduce((sum: number, item: StockItem) => sum + item.quantidade, 0);
      
      setStats({
        dosesHoje: todayVaccinations.length,
        pacientesHoje: uniquePatientIds.length,
        frascosAbertos: 0, // Not tracking opened vials in offline mode
        alertasPendentes: lowStock
      });
      
      setStock(allStock);
      setRecentVaccinations(todayVaccinations.slice(0, 10));
      setPatients(allPatients);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-[32px] border border-slate-100 shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-white rounded-[32px] border border-slate-100 shadow-sm" />
          <div className="h-[400px] bg-white rounded-[32px] border border-slate-100 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doses Hoje" 
          value={stats.dosesHoje} 
          icon={Syringe} 
          color="bg-rose-500" 
          delay={0}
        />
        <StatCard 
          title="Pacientes Vacinados" 
          value={stats.pacientesHoje} 
          icon={Users} 
          color="bg-emerald-500" 
          delay={0.1}
        />
        <StatCard 
          title="Total Pacientes" 
          value={patients.length} 
          icon={Package} 
          color="bg-amber-500" 
          delay={0.2}
        />
        <StatCard 
          title="Alertas Stock Baixo" 
          value={stats.alertasPendentes} 
          icon={Bell} 
          color="bg-purple-500" 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Vaccinations */}
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Vacinações de Hoje</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {recentVaccinations.length} Doses
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentVaccinations.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 flex-col gap-4 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <p className="font-medium">Nenhuma vacinação registrada hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVaccinations.map((vaccination) => {
                    const patient = patients.find(p => p.id === vaccination.patient_id);
                    return (
                      <motion.div 
                        key={vaccination.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <Syringe size={22} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{patient?.nome || 'Paciente #' + vaccination.patient_id}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{vaccination.vaccine_name}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dose {vaccination.dose_number}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400">
                            {vaccination.data_vacinacao ? new Date(vaccination.data_vacinacao).toLocaleTimeString('pt-AO') : ''}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Ações Rápidas</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => onNavigate('patients')}
                className="flex items-center gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <UserPlus size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-emerald-700">Novo Paciente</p>
                  <p className="text-xs text-emerald-500">Cadastrar paciente</p>
                </div>
              </button>
              
              <button 
                onClick={() => onNavigate('vaccinate')}
                className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-100 rounded-3xl hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                  <Syringe size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-blue-700">Vacinar</p>
                  <p className="text-xs text-blue-500">Registrar vacinação</p>
                </div>
              </button>
              
              <button 
                onClick={() => onNavigate('stock')}
                className="flex items-center gap-4 p-6 bg-amber-50 border border-amber-100 rounded-3xl hover:shadow-lg hover:shadow-amber-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                  <Package size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-amber-700">Entrada Stock</p>
                  <p className="text-xs text-amber-500">Adicionar vacinas</p>
                </div>
              </button>
              
              <button 
                onClick={() => onNavigate('stock')}
                className="flex items-center gap-4 p-6 bg-purple-50 border border-purple-100 rounded-3xl hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
                  <AlertCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-purple-700">Ver Estoque</p>
                  <p className="text-xs text-purple-500">Consultar disponibilidade</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Stock Overview */}
          <div className="card">
            <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Stock de Vacinas</h2>
            <div className="space-y-4">
              {stock.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-sm truncate">{item.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold uppercase tracking-widest ${
                        item.quantidade > 10 ? 'text-emerald-600' :
                        item.quantidade > 0 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {item.quantidade} doses
                      </span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    item.quantidade > 10 ? 'bg-emerald-500' :
                    item.quantidade > 0 ? 'bg-amber-500' :
                    'bg-rose-500'
                  }`} />
                </div>
              ))}
            </div>
            {stock.length > 6 && (
              <button 
                onClick={() => onNavigate('stock')}
                className="w-full mt-4 text-center text-sm text-blue-600 font-bold hover:text-blue-700"
              >
                Ver todas as vacinas →
              </button>
            )}
          </div>

          {/* Low Stock Alert */}
          {stats.alertasPendentes > 0 && (
            <div className="card bg-rose-50 border-rose-100 shadow-rose-500/5">
              <div className="flex items-center gap-3 text-rose-700 font-black mb-6 uppercase tracking-tight">
                <AlertCircle size={24} />
                <h2>Alertas</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-rose-600 font-medium">
                  {stats.alertasPendentes} vaccine(s) com stock baixo. Considere fazer novo pedido.
                </p>
                <button 
                  onClick={() => onNavigate('stock')}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 underline"
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
          )}

          {/* MINSA Logo */}
          <div className="card flex flex-col items-center justify-center py-6">
            <img 
              src="/minsa.png" 
              alt="MINSA - Ministério da Saúde de Angola" 
              className="h-16 w-auto object-contain"
            />
            <p className="text-xs text-slate-400 mt-3 font-medium text-center">
              Ministério da Saúde
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card flex items-center gap-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
    >
      <div className={`w-16 h-16 ${color} rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform`}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function UserPlus({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
