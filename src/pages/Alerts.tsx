import React from 'react';
import { AlertCircle, Clock, Bell, Package, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Alerts() {
  const alerts = [
    { 
      id: 1, 
      level: 'URGENTE', 
      type: 'Frasco Quase Expirado', 
      message: 'Frasco de Penta expira em 2 horas — 3 doses restantes',
      icon: Clock,
      color: 'rose'
    },
    { 
      id: 2, 
      level: 'ATENÇÃO', 
      type: 'Dose em Atraso', 
      message: 'Maria Silva — 2ª dose Polio estava prevista para 12/01/2025',
      icon: AlertCircle,
      color: 'amber'
    },
    { 
      id: 3, 
      level: 'INFO', 
      type: 'Stock Baixo', 
      message: 'BCG — apenas 2 frascos em stock',
      icon: Package,
      color: 'blue'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Central de Alertas</h2>
          <p className="text-slate-500 font-medium">Monitorização em tempo real das actividades do posto.</p>
        </div>
        <div className="w-16 h-16 bg-blue-50 text-[--color-brand-primary] rounded-[24px] flex items-center justify-center shadow-inner">
          <Bell size={32} />
        </div>
      </div>

      <div className="space-y-6">
        {alerts.map((alert) => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`card border-none shadow-xl shadow-blue-900/5 ${
              alert.color === 'rose' ? 'bg-rose-50/50' :
              alert.color === 'amber' ? 'bg-amber-50/50' :
              'bg-blue-50/50'
            } flex items-start gap-6 p-6 relative overflow-hidden group hover:shadow-2xl transition-all`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${
              alert.color === 'rose' ? 'bg-rose-500' :
              alert.color === 'amber' ? 'bg-amber-500' :
              'bg-blue-500'
            }`} />
            
            <div className={`p-4 rounded-[20px] shadow-sm ${
              alert.color === 'rose' ? 'bg-white text-rose-600' :
              alert.color === 'amber' ? 'bg-white text-amber-600' :
              'bg-white text-blue-600'
            }`}>
              <alert.icon size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-widest ${
                  alert.color === 'rose' ? 'text-rose-600' :
                  alert.color === 'amber' ? 'text-amber-600' :
                  'text-blue-600'
                }`}>
                  {alert.level}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Há 5 min</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{alert.type}</h3>
              <p className="text-slate-600 font-medium mt-1 leading-relaxed">{alert.message}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card bg-slate-50 border-dashed border-4 border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400 rounded-[40px]">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Info size={32} strokeWidth={1.5} className="text-slate-200" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest">O sistema verifica automaticamente novas regras a cada 30 minutos.</p>
      </div>
    </div>
  );
}
