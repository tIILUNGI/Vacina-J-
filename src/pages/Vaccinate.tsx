import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Syringe, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  UserPlus,
  X,
  Info,
  History,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Vaccine, Administration, getVaccineStatus, calculateAge } from '../utils/vaccineRules';
import { localStorageService, Patient as LocalPatient, Vaccination, StockItem } from '../utils/localStorage';
import apiFetch from '../utils/api';

export default function Vaccinate({ patientId, onComplete }: { patientId?: number | null; onComplete?: () => void }) {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Vaccine | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchVaccines();
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    // If patientId is provided, fetch that patient
    if (patientId) {
      fetchPatientById(patientId);
    }
  }, [patientId]);

  const fetchPatientById = async (id: number) => {
    try {
      // Try localStorage first (offline mode)
      const patient = localStorageService.patients.getById(id);
      if (patient) {
        // Get vaccination history for this patient
        const history = localStorageService.vaccinations.getByPatientId(id);
        setSelectedPatient({ ...patient, history } as any);
        return;
      }
      // Fallback to API
      const res = await apiFetch(`/api/pacientes/${id}`);
      const data = await res.json();
      setSelectedPatient(data);
    } catch (error) {
      console.error('Error fetching patient by id:', error);
    }
  };

  const fetchVaccines = async () => {
    try {
      // Get vaccines from localStorage (stock)
      const stockItems = localStorageService.stock.getAll();
      const vaccines = stockItems.map((item: StockItem) => ({
        id: item.id,
        nome: item.nome,
        doses_por_frasco: 10,
        prazo_uso_horas: 6,
        grupo_alvo: 'Geral',
        total_doses_esquema: 1
      }));
      setVaccines(vaccines as any);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    setLoading(true);
    try {
      // Use localStorage for offline mode
      const results = localStorageService.patients.search(query);
      setPatients(results as any);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    try {
      // Get full patient data and vaccination history from localStorage
      const fullPatient = localStorageService.patients.getById(patient.id);
      if (fullPatient) {
        const history = localStorageService.vaccinations.getByPatientId(patient.id);
        setSelectedPatient({ ...fullPatient, history } as any);
        setPatients([]);
        setSearch('');
        return;
      }
      // Fallback to API
      const res = await apiFetch(`/api/pacientes/${patient.id}`);
      const data = await res.json();
      setSelectedPatient(data);
      setPatients([]);
      setSearch('');
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

const handleAdminister = async (vaccine: Vaccine) => {
    try {
      const res = await apiFetch('/api/administrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: selectedPatient?.id,
          vacina_id: vaccine.id,
          user_id: user?.id,
          observacoes: ''
        })
      });
      
      if (res.ok) {
        setShowConfirm(null);
        if (selectedPatient) handleSelectPatient(selectedPatient);
        if (onComplete) onComplete();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao administrar vacina');
      }
    } catch (error) {
      console.error('Error administering vaccine:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Section */}
      <div className="relative z-50">
        <div className="card p-5 flex items-center gap-6 shadow-2xl shadow-blue-900/5 border-none bg-white/90 backdrop-blur-md">
          <Search className="text-[--color-brand-primary]" size={28} />
          <input 
            type="text"
            placeholder="Pesquisar paciente por nome ou BI..."
            className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {loading && <div className="w-6 h-6 border-3 border-[--color-brand-primary] border-t-transparent rounded-full animate-spin" />}
        </div>

        <AnimatePresence>
          {patients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-[60]"
            >
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full p-6 text-left hover:bg-blue-50 flex items-center justify-between group border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div>
                    <p className="font-black text-slate-900 group-hover:text-[--color-brand-primary] transition-colors">{p.nome}</p>
                    <p className="text-sm text-slate-500 font-medium">BI: {p.numero_identificacao || 'N/A'} • {calculateAge(p.data_nascimento).years} anos</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[--color-brand-primary] group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Patient Profile & Calendar */}
      <AnimatePresence mode="wait">
        {selectedPatient ? (
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="card bg-[--color-brand-primary] text-white border-none flex items-center justify-between shadow-2xl shadow-blue-600/20 p-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center text-3xl font-black backdrop-blur-md shadow-inner">
                  {selectedPatient.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{selectedPatient.nome}</h2>
                  <p className="text-blue-100 flex items-center gap-2 font-bold mt-1">
                    <Clock size={18} /> 
                    {calculateAge(selectedPatient.data_nascimento).years} anos, {calculateAge(selectedPatient.data_nascimento).months} meses
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vaccines.map((v) => {
                const status = getVaccineStatus(selectedPatient, v, (selectedPatient as any).history || []);
                return (
                  <button
                    key={v.id}
                    disabled={status.status === 'complete' || status.status === 'blocked'}
                    onClick={() => setShowConfirm(v)}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all flex items-center justify-between group ${
                      status.status === 'complete' ? 'bg-blue-50 border-blue-100 opacity-90 cursor-default' :
                      status.status === 'due' ? 'bg-white border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10' :
                      'bg-slate-50 border-slate-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center shadow-sm ${
                        status.status === 'complete' ? 'bg-white text-blue-600' :
                        status.status === 'due' ? 'bg-blue-600 text-white' :
                        'bg-slate-200 text-slate-400'
                      }`}>
                        <Syringe size={28} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg tracking-tight">{v.nome}</p>
                        <p className={`text-xs font-black uppercase tracking-widest mt-0.5 ${
                          status.status === 'complete' ? 'text-blue-600' :
                          status.status === 'due' ? 'text-blue-400' :
                          'text-slate-400'
                        }`}>
                          {status.label}
                        </p>
                      </div>
                    </div>
                    {status.status === 'due' && (
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        <Plus size={24} />
                      </div>
                    )}
                    {status.status === 'complete' && <CheckCircle2 size={32} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="card py-32 flex flex-col items-center justify-center text-slate-400 border-dashed border-4 border-slate-100 bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-8 shadow-sm">
              <Search size={48} strokeWidth={1.5} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Pronto para Vacinar</h2>
            <p className="text-center max-w-sm font-medium text-slate-500">Pesquise um paciente para ver o calendário vacinal e registar novas doses com apenas 3 cliques.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-10 text-center space-y-8">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck size={48} />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Confirmar Vacinação</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Está prestes a registar a vacina <span className="font-black text-blue-600">{showConfirm.nome}</span> para <span className="font-black text-slate-900">{selectedPatient?.nome}</span>.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl text-left space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Responsável</span>
                    <span className="font-black text-slate-900">{user?.nome_completo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Data</span>
                    <span className="font-black text-slate-900">{new Date().toLocaleDateString('pt-AO')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleAdminister(showConfirm)}
                    className="btn-primary w-full py-5 text-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
                  >
                    Confirmar e Registar
                  </button>
                  <button 
                    onClick={() => setShowConfirm(null)}
                    className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                  >
                    Cancelar Operação
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
