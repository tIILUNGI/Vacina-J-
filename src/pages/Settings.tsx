import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Lock,
  UserCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import apiFetch from '../utils/api';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'enfermeiro';
  nome_completo: string;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar este utilizador?')) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Lock size={64} strokeWidth={1} className="mb-4" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Acesso Restrito</h2>
        <p className="font-medium">Apenas administradores podem gerir utilizadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestão de Utilizadores</h2>
          <p className="text-slate-500 font-medium">Controle quem tem acesso ao sistema Vacina Já.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setShowAddForm(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={24} /> Criar Utilizador
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((user) => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-none shadow-xl shadow-blue-900/5 p-8 flex flex-col items-center text-center relative group"
          >
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {user.role}
            </div>
            
            <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center text-blue-600 mb-6 shadow-inner group-hover:scale-110 transition-transform">
              <UserCircle size={48} strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{user.nome_completo}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-6">@{user.username}</p>
            
            <div className="flex gap-2 w-full mt-auto">
              <button 
                onClick={() => {
                  setEditingUser(user);
                  setShowAddForm(true);
                }}
                className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={14} /> Editar
              </button>
              {user.id !== currentUser.id && (
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 lg:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                </h2>
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              <form className="p-6 lg:p-10 space-y-6 overflow-y-auto" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                // Generate temporary password if not editing
                const payload = editingUser ? data : {
                  ...data,
                  temporary_password: data.password
                };
                try {
                  const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
                  const method = editingUser ? 'PUT' : 'POST';
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    setShowAddForm(false);
                    fetchUsers();
                    if (!editingUser) {
                      alert(`Utilizador criado com sucesso!\n\nNome de utilizador: ${data.username}\nPalavra-passe temporária: ${data.password}\n\nO utilizador deverá usar o "Primeiro Acesso" para ativar a sua conta.`);
                    }
                  }
                } catch (error) {
                  console.error('Error saving user:', error);
                }
              }}>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input name="nome_completo" defaultValue={editingUser?.nome_completo} required className="input-field" placeholder="Ex: João Manuel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome de Utilizador</label>
                  <input name="username" defaultValue={editingUser?.username} required className="input-field" placeholder="Ex: joao.manuel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Email</label>
                  <input name="email" type="email" defaultValue={editingUser?.email || ''} className="input-field" placeholder="Ex: joao@email.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">
                    {editingUser ? 'Nova Palavra-passe (opcional)' : 'Palavra-passe Temporária'}
                  </label>
                  <input name="password" type="password" required={!editingUser} className="input-field" placeholder="••••••••" />
                  {!editingUser && <p className="text-xs text-slate-500">Esta será a palavra-passe temporária que o utilizador deverá alterar no primeiro acesso.</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Cargo / Função</label>
                  <select name="role" defaultValue={editingUser?.role || 'enfermeiro'} required className="input-field">
                    <option value="enfermeiro">Enfermeiro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-50">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary px-8">Cancelar</button>
                  <button type="submit" className="btn-primary px-10">
                    {editingUser ? 'Salvar Alterações' : 'Criar Utilizador'}
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
