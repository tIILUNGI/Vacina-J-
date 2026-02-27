import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  Calendar, 
  Phone, 
  MapPin, 
  IdCard,
  History,
  Syringe,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Users,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Administration, calculateAge, getVaccineStatus, Vaccine } from '../utils/vaccineRules';
import apiFetch from '../utils/api';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchPatients();
    fetchVaccines();
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/pacientes${query ? `?q=${query}` : ''}`);
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccines = async () => {
    try {
      const res = await apiFetch('/api/vacinas');
      const data = await res.json();
      setVaccines(data);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleSelectPatient = async (id: number) => {
    try {
      const res = await apiFetch(`/api/pacientes/${id}`);
      const data = await res.json();
      setSelectedPatient(data);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar este paciente?')) return;
    try {
      const res = await apiFetch(`/api/pacientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedPatient(null);
        fetchPatients();
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input 
            type="text"
            placeholder="Pesquisar por nome ou BI..."
            className="input-field pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <button 
          onClick={() => {
            setEditingPatient(null);
            setShowAddForm(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={24} /> Novo Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Patients List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-0 overflow-hidden border-none shadow-xl shadow-blue-900/5">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Lista de Pacientes</h2>
            </div>
            <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">Carregando...</div>
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`w-full p-6 text-left hover:bg-blue-50 transition-all flex items-center justify-between group ${
                      selectedPatient?.id === p.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.nome}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">BI: {p.numero_identificacao || 'N/A'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 font-medium">Nenhum paciente encontrado.</div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div
                key={selectedPatient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="card border-none shadow-2xl shadow-blue-900/5 p-8">
                  <div className="flex justify-between items-start mb-10">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[28px] flex items-center justify-center text-3xl font-black shadow-inner">
                      {selectedPatient.nome.charAt(0)}
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedPatient.nome}</h2>
                      <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-2 font-bold mt-1">
                        <Calendar size={18} className="text-blue-600" /> 
                        {new Date(selectedPatient.data_nascimento).toLocaleDateString('pt-AO')} 
                        <span className="text-blue-400">({calculateAge(selectedPatient.data_nascimento).years} anos)</span>
                      </p>
                    </div>
                  </div>
                    <div className="flex gap-3">
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingPatient(selectedPatient);
                              setShowAddForm(true);
                            }}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                          >
                            <Users size={20} />
                          </button>
                          <button 
                            onClick={() => handleDeletePatient(selectedPatient.id)}
                            className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                      {selectedPatient.gravida && (
                        <span className="px-4 py-2 bg-pink-50 text-pink-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-pink-100">Grávida</span>
                      )}
                      {selectedPatient.puerpera && (
                        <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-purple-100">Puérpera</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-slate-50">
                    <InfoItem icon={IdCard} label="Identificação" value={selectedPatient.numero_identificacao || 'N/A'} />
                    <InfoItem icon={Phone} label="Contacto" value={selectedPatient.contacto_responsavel || 'N/A'} />
                    <InfoItem icon={MapPin} label="Localidade" value={selectedPatient.localidade || 'N/A'} />
                    <InfoItem icon={Calendar} label="Sexo" value={selectedPatient.sexo === 'M' ? 'Masculino' : 'Feminino'} />
                  </div>

                  <div className="mt-10">
                    <div className="flex gap-8 border-b border-slate-50 mb-8">
                      <button className="pb-4 border-b-4 border-blue-600 text-blue-600 font-black uppercase tracking-widest text-sm">Calendário Vacinal</button>
                      <button className="pb-4 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-sm">Histórico Completo</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vaccines.map((v) => {
                        const status = getVaccineStatus(selectedPatient, v, (selectedPatient as any).history || []);
                        return (
                          <div key={v.id} className="p-6 rounded-[28px] border border-slate-50 bg-slate-50/30 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                status.status === 'complete' ? 'bg-blue-50 text-blue-600' :
                                status.status === 'due' ? 'bg-blue-400 text-white' :
                                'bg-slate-200 text-slate-400'
                              }`}>
                                <Syringe size={24} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 tracking-tight">{v.nome}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{status.label}</p>
                              </div>
                            </div>
                            {status.status === 'complete' ? (
                              <CheckCircle2 size={24} className="text-blue-600" />
                            ) : status.status === 'due' ? (
                              <Clock size={24} className="text-blue-400" />
                            ) : (
                              <AlertCircle size={24} className="text-slate-200" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center py-32 text-slate-300 border-none bg-slate-50/30">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm">
                  <Users size={64} strokeWidth={1} />
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Seleccione um paciente para ver os detalhes</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Patient Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 lg:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {editingPatient ? 'Editar Cadastro' : 'Novo Cadastro'}
                </h2>
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              <form className="p-6 lg:p-10 space-y-6 lg:space-y-8 overflow-y-auto" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                try {
                  const url = editingPatient ? `/api/pacientes/${editingPatient.id}` : '/api/pacientes';
                  const method = editingPatient ? 'PUT' : 'POST';
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, userId: user?.id })
                  });
                  if (res.ok) {
                    setShowAddForm(false);
                    fetchPatients();
                    if (editingPatient) handleSelectPatient(editingPatient.id);
                  }
                } catch (error) {
                  console.error('Error saving patient:', error);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome Completo *</label>
                    <input name="nome" defaultValue={editingPatient?.nome} required className="input-field" placeholder="Nome do paciente" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Data de Nascimento *</label>
                    <input name="data_nascimento" defaultValue={editingPatient?.data_nascimento} type="date" required className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Sexo *</label>
                    <select name="sexo" defaultValue={editingPatient?.sexo} required className="input-field">
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nº Identificação (BI/Cartão)</label>
                    <input name="numero_identificacao" defaultValue={editingPatient?.numero_identificacao} className="input-field" placeholder="000000000LA000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Localidade / Bairro</label>
                    <input name="localidade" defaultValue={editingPatient?.localidade} className="input-field" placeholder="Ex: Maianga" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Contacto Responsável</label>
                    <input name="contacto_responsavel" defaultValue={editingPatient?.contacto_responsavel} className="input-field" placeholder="+244 9XX XXX XXX" />
                  </div>
                </div>

                <div className="flex gap-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" name="gravida" defaultChecked={editingPatient?.gravida} className="peer w-6 h-6 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                    </div>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Está Grávida?</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" name="puerpera" defaultChecked={editingPatient?.puerpera} className="peer w-6 h-6 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                    </div>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Puérpera?</span>
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-50">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary px-8">Cancelar</button>
                  <button type="submit" className="btn-primary px-10">
                    {editingPatient ? 'Salvar Alterações' : 'Salvar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
        <Icon size={14} className="text-blue-600" /> {label}
      </p>
      <p className="text-base font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}
