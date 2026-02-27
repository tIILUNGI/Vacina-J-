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
import apiFetch from '../utils/api';

interface Stats {
  dosesHoje: number;
  pacientesHoje: number;
  frascosAbertos: number;
  alertasPendentes: number;
}

interface OpenVial {
  id: number;
  vacina_nome: string;
  doses_restantes: number;
  data_expiracao_uso: string;
  prazo_uso_horas: number;
}

interface Appointment {
  id: number;
  paciente_id: number;
  vaccine_id: number;
  data_agendada: string;
  hora_agendada: string;
  status: string;
  paciente_nome: string;
  vaccine_nome: string;
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: any, patientId?: number) => void }) {
  const [stats, setStats] = useState<Stats>({ dosesHoje: 0, pacientesHoje: 0, frascosAbertos: 0, alertasPendentes: 0 });
  const [openVials, setOpenVials] = useState<OpenVial[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, vialsRes, appointmentsRes] = await Promise.all([
          apiFetch('/api/dashboard/stats'),
          apiFetch('/api/stock/abertos'),
          apiFetch('/api/agendamentos/today')
        ]);
        const statsData = await statsRes.json();
        const vialsData = await vialsRes.json();
        const appointmentsData = await appointmentsRes.json();
        // Sort by hora_agendada and vaccine type
        const sortedAppointments = appointmentsData.sort((a: Appointment, b: Appointment) => {
          // First by time
          if (a.hora_agendada !== b.hora_agendada) {
            return a.hora_agendada.localeCompare(b.hora_agendada);
          }
          // Then by vaccine name
          return a.vaccine_nome.localeCompare(b.vaccine_nome);
        });
        setStats(statsData);
        setOpenVials(vialsData);
        setAppointments(sortedAppointments);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const calculateRemainingPercentage = (expiry: string, totalHours: number) => {
    const remaining = new Date(expiry).getTime() - Date.now();
    const total = totalHours * 60 * 60 * 1000;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  const calculateTimeRemaining = (expiry: string) => {
    const remaining = new Date(expiry).getTime() - Date.now();
    if (remaining <= 0) return 'Expirado';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
          title="Frascos Abertos" 
          value={stats.frascosAbertos} 
          icon={Package} 
          color="bg-amber-500" 
          delay={0.2}
        />
        <StatCard 
          title="Alertas Pendentes" 
          value={stats.alertasPendentes} 
          icon={Bell} 
          color="bg-purple-500" 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Appointments Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Pacientes Previstos para Hoje</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {appointments.length} Agendados
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 flex-col gap-4 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <p className="font-medium">Nenhum agendamento para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt) => (
                    <motion.div 
                      key={appt.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                          <Clock size={22} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{appt.paciente_nome}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{appt.hora_agendada}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{appt.vacina_nome}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('vaccinate', appt.paciente_id)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play size={16} fill="currentColor" />
                        Iniciar
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily List Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Lista do Dia</h2>
              <button 
                onClick={() => onNavigate('vaccinate')}
                className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                Ver todos <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center py-16 text-slate-400 flex-col gap-4 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Users size={40} strokeWidth={1} className="text-slate-300" />
                </div>
                <p className="font-medium">Nenhum paciente vacinado hoje</p>
                <button 
                  onClick={() => onNavigate('vaccinate')}
                  className="btn-primary mt-2"
                >
                  <Plus size={20} /> Novo Atendimento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Frascos Ativos</h2>
            <div className="space-y-6">
              {openVials.length > 0 ? (
                openVials.map((vial) => (
                  <div key={vial.id} className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-slate-200"
                        />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={175.9}
                          initial={{ strokeDashoffset: 175.9 }}
                          animate={{ strokeDashoffset: 175.9 - (175.9 * calculateRemainingPercentage(vial.data_expiracao_uso, vial.prazo_uso_horas || 6)) / 100 }}
                          className="text-blue-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Clock size={16} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 truncate">{vial.vacina_nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                          {calculateTimeRemaining(vial.data_expiracao_uso)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {vial.doses_restantes} doses
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm font-medium">
                  Nenhum frasco aberto no momento
                </div>
              )}
            </div>
          </div>

          <div className="card bg-rose-50 border-rose-100 shadow-rose-500/5">
            <div className="flex items-center gap-3 text-rose-700 font-black mb-6 uppercase tracking-tight">
              <AlertCircle size={24} />
              <h2>Alertas Críticos</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-rose-600 font-medium">Nenhum alerta crítico detectado.</p>
            </div>
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
