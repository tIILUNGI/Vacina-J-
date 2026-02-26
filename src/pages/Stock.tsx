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

interface StockItem {
  vacina_nome: string;
  vacina_id: number;
  frascos_disponiveis: number;
  frascos_abertos: number;
  validade_proxima: string;
}

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
    fetchVaccines();
    fetchHistory();
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      setStock(data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/stock/history');
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchVaccines = async () => {
    try {
      const res = await fetch('/api/vacinas');
      const data = await res.json();
      setVaccines(data);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const handleDeleteStock = async (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar este registo de stock?')) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStock();
        fetchHistory();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const handleDeleteVaccine = async (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar esta vacina? Isso pode afectar registos históricos.')) return;
    try {
      const res = await fetch(`/api/vacinas/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVaccines();
    } catch (error) {
      console.error('Error deleting vaccine:', error);
    }
  };

  const handleBackup = async () => {
    window.location.href = '/api/system/backup';
  };

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
          {user?.role === 'admin' && (
            <TabButton 
              active={activeTab === 'vaccines'} 
              onClick={() => setActiveTab('vaccines')} 
              icon={Search} 
              label="Vacinas" 
            />
          )}
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
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Frascos Disp.</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Frascos Abertos</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Próxima Validade</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stock.map((item) => (
                  <tr key={item.vacina_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 font-black text-slate-900 text-lg tracking-tight">{item.vacina_nome}</td>
                    <td className="p-6 text-slate-600 font-bold">{item.frascos_disponiveis || 0}</td>
                    <td className="p-6">
                      <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${
                        item.frascos_abertos > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {item.frascos_abertos > 0 ? `${item.frascos_abertos} Aberto` : 'Nenhum'}
                      </span>
                    </td>
                    <td className="p-6 text-slate-600 font-medium">
                      {item.validade_proxima ? new Date(item.validade_proxima).toLocaleDateString('pt-AO') : 'N/A'}
                    </td>
                    <td className="p-6 text-right">
                      {(item.frascos_disponiveis || 0) > 5 ? (
                        <span className="text-blue-600 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <CheckCircle2 size={18} /> Suficiente
                        </span>
                      ) : (item.frascos_disponiveis || 0) > 0 ? (
                        <span className="text-blue-400 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <AlertCircle size={18} /> Baixo
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-end gap-2 text-sm font-black uppercase tracking-widest">
                          <XCircle size={18} /> Sem Stock
                        </span>
                      )}
                    </td>
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
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 text-slate-600 font-medium">{new Date(h.data_entrada).toLocaleDateString('pt-AO')}</td>
                    <td className="p-6 font-black text-slate-900">{h.vacina_nome}</td>
                    <td className="p-6 text-slate-600">{h.lote}</td>
                    <td className="p-6 text-slate-600">{new Date(h.validade).toLocaleDateString('pt-AO')}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        h.estado === 'disponivel' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        h.estado === 'aberto' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {h.estado}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {user?.role === 'admin' && h.estado === 'disponivel' && (
                        <button 
                          onClick={() => handleDeleteStock(h.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'vaccines' && (
          <motion.div 
            key="vaccines"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catálogo de Vacinas</h2>
              <button 
                onClick={() => {
                  setEditingVaccine(null);
                  setShowVaccineForm(true);
                }}
                className="btn-primary"
              >
                <Plus size={20} /> Nova Vacina
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaccines.map((v) => (
                <div key={v.id} className="card p-6 border-none shadow-xl shadow-blue-900/5 flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingVaccine(v);
                          setShowVaccineForm(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVaccine(v.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{v.nome}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{v.grupo_alvo}</p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Doses/Frasco:</span>
                    <span className="font-black text-blue-600">{v.doses_por_frasco}</span>
                  </div>
                </div>
              ))}
            </div>
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
            <form className="space-y-8" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              try {
                const res = await fetch('/api/stock/entrada', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...data, userId: user?.id })
                });
                if (res.ok) {
                  setActiveTab('current');
                  fetchStock();
                }
              } catch (error) {
                console.error('Error adding stock:', error);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Vacina *</label>
                  <select name="vacina_id" required className="input-field">
                    {vaccines.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
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

      {/* Vaccine Modal */}
      <AnimatePresence>
        {showVaccineForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 lg:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {editingVaccine ? 'Editar Vacina' : 'Nova Vacina'}
                </h2>
                <button onClick={() => setShowVaccineForm(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              <form className="p-6 lg:p-10 space-y-6 overflow-y-auto" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                try {
                  const url = editingVaccine ? `/api/vacinas/${editingVaccine.id}` : '/api/vacinas';
                  const method = editingVaccine ? 'PUT' : 'POST';
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    setShowVaccineForm(false);
                    fetchVaccines();
                  }
                } catch (error) {
                  console.error('Error saving vaccine:', error);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome da Vacina</label>
                    <input name="nome" defaultValue={editingVaccine?.nome} required className="input-field" placeholder="Ex: BCG" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Doses por Frasco</label>
                    <input name="doses_por_frasco" type="number" defaultValue={editingVaccine?.doses_por_frasco} required className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Prazo Uso (Horas)</label>
                    <input name="prazo_uso_horas" type="number" defaultValue={editingVaccine?.prazo_uso_horas} required className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Grupo Alvo</label>
                    <select name="grupo_alvo" defaultValue={editingVaccine?.grupo_alvo || 'crianca'} className="input-field">
                      <option value="crianca">Criança</option>
                      <option value="gravida">Grávida</option>
                      <option value="mif">Mulher Idade Fértil</option>
                      <option value="todos">Todos</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Total Doses Esquema</label>
                    <input name="total_doses_esquema" type="number" defaultValue={editingVaccine?.total_doses_esquema || 1} required className="input-field" />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-8 border-t border-slate-50">
                  <button type="button" onClick={() => setShowVaccineForm(false)} className="btn-secondary px-8">Cancelar</button>
                  <button type="submit" className="btn-primary px-10">Salvar Vacina</button>
                </div>
              </form>
            </motion.div>
          </div>
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
