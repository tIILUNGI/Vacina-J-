import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Trash2, 
  TrendingUp,
  ChevronRight,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const reportTypes = [
    { 
      id: 'diario', 
      title: 'Registo Diário', 
      desc: 'Equivalente ao livro diário do MINSA. Doses por vacina e grupo.',
      icon: FileText,
      color: 'bg-blue-500'
    },
    { 
      id: 'mensal', 
      title: 'Consolidado Mensal', 
      desc: 'Totais automáticos do mês para reporte oficial.',
      icon: BarChart3,
      color: 'bg-emerald-500'
    },
    { 
      id: 'paciente', 
      title: 'Histórico por Paciente', 
      desc: 'Cartão de vacinação digital completo.',
      icon: Users,
      color: 'bg-purple-500'
    },
    { 
      id: 'desperdicio', 
      title: 'Relatório de Desperdício', 
      desc: 'Frascos expirados e doses perdidas no período.',
      icon: Trash2,
      color: 'bg-rose-500'
    },
    { 
      id: 'cobertura', 
      title: 'Cobertura Vacinal', 
      desc: 'Percentagem de crianças com esquema completo.',
      icon: TrendingUp,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reportTypes.map((report) => (
          <motion.button
            key={report.id}
            whileHover={{ y: -8 }}
            onClick={() => setActiveReport(report.id)}
            className="card text-left border-none shadow-xl shadow-blue-900/5 hover:shadow-2xl transition-all group p-8"
          >
            <div className={`w-16 h-16 ${report.color} rounded-[24px] flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-900/10 group-hover:scale-110 transition-transform`}>
              <report.icon size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-[--color-brand-primary] transition-colors uppercase">{report.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">{report.desc}</p>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gerar Agora</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-[--color-brand-primary] transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {activeReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-none shadow-2xl shadow-blue-900/10 p-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[--color-brand-primary] shadow-inner">
                <Calendar size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{reportTypes.find(r => r.id === activeReport)?.title}</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Período: {new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button className="btn-secondary flex-1 md:flex-none justify-center">
                <Printer size={20} /> Imprimir
              </button>
              <button className="btn-primary flex-1 md:flex-none justify-center">
                <Download size={20} /> Exportar PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm">
              <FileText size={48} strokeWidth={1.5} className="text-slate-200" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight mb-2">Processando dados...</p>
            <p className="text-slate-400 font-medium text-center max-w-md">Esta funcionalidade requer a base de dados preenchida com registos reais para gerar as estatísticas oficiais.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
