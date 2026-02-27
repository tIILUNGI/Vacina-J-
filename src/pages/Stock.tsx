import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  ChevronRight,
  Search,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localStorageService, StockItem } from '../utils/localStorage';

export default function Stock() {
  const [activeTab, setActiveTab] = useState<'current' | 'entry' | 'waste' | 'vaccines' | 'history'>('current');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [editingVaccine, setEditingVaccine] = useState<any>(null);
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchStock();
    fetchHistory();
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchStock = () => {
    try {
      const allStock = localStorageService.stock.getAll();
      setStock(allStock);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = () => {
    // For offline mode, we can derive history from stock entries
    // For now, we'll just show the current stock as history
    setHistory([]);
  };

  const handleDeleteStock = (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar este registo de stock?')) return;
    try {
      const success = localStorageService.stock.delete(id);
      if (success) {
        fetchStock();
      } else {
        alert('Erro ao eliminar stock');
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const stockData = {
      nome: formData.get('vacina_nome') as string,
      quantidade: parseInt(formData.get('quantidade') as string) || 0,
      validade: formData.get('validade') as string,
      lote: formData.get('lote') as string,
    };

    try {
      localStorageService.stock.add(stockData as any);
      setActiveTab('current');
      fetchStock();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleBackup = () => {
    // Export all data to a JSON file
    const data = {
      patients: localStorageService.patients.getAll(),
      stock: localStorageService.stock.getAll(),
      vaccinations: localStorageService.vaccinations.getAll(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vacina_ja_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Vaccine names for the dropdown
  const vaccineNames = [
    'Vacina BCG',
    'Vacina Poliomielite (OPV)',
    'Vacina Pentavalente',
    'Vacina Febre Amarela',
    'Vacina Sarampo',
    'Vacina COVID-19',
    'Vacina Hepatite B',
    'Vacina Antitetânica'
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-[24px] border border-slate-100 shadow-xl shadow-blue-900/5 w-full xl:w-auto">
          <TabButton 
            active={activeTab === 'current'} 
            onClick={() => setActiveTab('current')} 
            icon={Package} 
            label="Stock" 
          />
          <TabButton 
            active={activeTab === 'entry'} 
            onClick={() => setActiveTab('entry')} 
            icon={Plus} 
            label="Entrada" 
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={History} 
            label="Histórico" 
          />
          <TabButton 
            active={activeTab === 'waste'} 
            onClick={() => setActiveTab('waste')} 
            icon={Trash2} 
            label="Desperdício" 
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleBackup}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <Download size={20} /> Backup
          </button>
          <button 
            onClick={() => setActiveTab('entry')}
            className="btn-primary flex-1 sm:flex-none"
          >
            <Plus size={24} /> Entrada
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'current' && (
          <motion.div 
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-0 overflow-hidden border-none shadow-2xl shadow-blue-900/5 overflow-x-auto"
          >
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-50">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vacina</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Quantidade</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Lote</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Validade</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                  {user?.role === 'admin' && (
                    <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stock.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 font-black text-slate-900 text-lg tracking-tight">{item.nome}</td>
                    <td className="p-6 text-slate-600 font-bold">{item.quantidade || 0}</td>
                    <td className="p-6 text-slate-600 font-medium">{item.lote || 'N/A'}</td>
                    <td className="p-6 text-slate-600 font-medium">
                      {item.validade ? new Date(item.validade).toLocaleDateString('pt-AO') : 'N/A'}
                    </td>
                    <td className="p-6 text-right">
                      {(item.quantidade || 0) > 5 ? (
                        <span className="text-blue-600 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <CheckCircle2 size={18} /> Suficiente
                        </span>
                      ) : (item.quantidade || 0) > 0 ? (
                        <span className="text-blue-400 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <AlertCircle size={18} /> Baixo
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <XCircle size={18} /> Sem Stock
                        </span>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => handleDeleteStock(item.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                          title="Eliminar stock"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-0 overflow-hidden border-none shadow-2xl shadow-blue-900/5 overflow-x-auto"
          >
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-50">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Data Entrada</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vacina</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Lote</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Validade</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stock.map((h) => (
                  <tr key={h.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 text-slate-600 font-medium">{h.created_at ? new Date(h.created_at).toLocaleDateString('pt-AO') : 'N/A'}</td>
                    <td className="p-6 font-black text-slate-900">{h.nome}</td>
                    <td className="p-6 text-slate-600">{h.lote}</td>
                    <td className="p-6 text-slate-600">{h.data_validade ? new Date(h.data_validade).toLocaleDateString('pt-AO') : 'N/A'}</td>
                    <td className="p-6 text-slate-600">{h.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'entry' && (
          <motion.div 
            key="entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card max-w-2xl mx-auto p-10 border-none shadow-2xl shadow-blue-900/5"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight uppercase">Registar Entrada</h2>
            <form className="space-y-8" onSubmit={handleAddStock}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Vacina *</label>
                  <select name="vacina_nome" required className="input-field">
                    {vaccineNames.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Lote *</label>
                  <input name="lote" required className="input-field" placeholder="Ex: ABC123XYZ" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Data de Validade *</label>
                  <input name="validade" type="date" required className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Quantidade de Frascos *</label>
                  <input name="quantidade" type="number" min="1" required className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-50">
                <button type="button" onClick={() => setActiveTab('current')} className="btn-secondary px-8">Cancelar</button>
                <button type="submit" className="btn-primary px-10">Confirmar Entrada</button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'waste' && (
          <motion.div 
            key="waste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card py-32 flex flex-col items-center justify-center text-slate-300 border-none bg-slate-50/30"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm">
              <Trash2 size={48} strokeWidth={1.5} className="text-slate-200" />
            </div>
            <p className="text-xl font-black text-slate-900 tracking-tight">Nenhum desperdício registado no período.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-[20px] transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold'
      }`}
    >
      <Icon size={20} />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </button>
  );
}

function XCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}
