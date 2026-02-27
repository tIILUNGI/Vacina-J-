import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Lock, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Bell,
  Download,
  FileText,
  Trash2,
  Syringe,
  Package,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import apiFetch from '../utils/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function Profile({ onNavigate }: { onNavigate?: (page: any) => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'reports'>('profile');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile_picture: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetchProfile(parsed.id);
      fetchNotifications(parsed.id);
    }
  }, []);

  const fetchNotifications = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/notifications/${userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/read/${id}`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const generateReport = async (type: 'vaccinations' | 'patients' | 'stock' | 'daily' | 'monthly' | 'waste' | 'coverage') => {
    // First, fetch the data from the API
    let apiEndpoint = '';
    let title = '';
    let filename = '';
    
    if (type === 'vaccinations' || type === 'daily') {
      apiEndpoint = '/api/reports/daily';
      title = 'Relatório de Vacinações do Dia';
      filename = `relatorio_vacinacoes_diario_${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (type === 'patients') {
      apiEndpoint = '/api/pacientes';
      title = 'Relatório de Pacientes';
      filename = `relatorio_pacientes_${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (type === 'stock') {
      apiEndpoint = '/api/vacinas';
      title = 'Relatório de Stock de Vacinas';
      filename = `relatorio_stock_${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (type === 'monthly') {
      apiEndpoint = '/api/reports/monthly';
      title = 'Relatório Mensal de Vacinações';
      const now = new Date();
      filename = `relatorio_vacinacoes_mensal_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
    } else if (type === 'waste') {
      apiEndpoint = '/api/reports/waste';
      title = 'Relatório de Vacinas Perdidas/Descarte';
      filename = `relatorio_desperdicio_${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (type === 'coverage') {
      apiEndpoint = '/api/reports/coverage';
      title = 'Relatório de Cobertura Vacinal';
      filename = `relatorio_cobertura_${new Date().toISOString().split('T')[0]}.pdf`;
    }

    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header with blue background
      doc.setFillColor(30, 58, 138); // blue-900
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Load and add MINSA logo (left side)
      try {
        const minsaLogo = '/minsa.png';
        doc.addImage(minsaLogo, 'PNG', margin, 12, 26, 26);
      } catch (e) {
        // Fallback if logo not found
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(margin, 12, 26, 26, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('MINSA', margin + 13, 27, { align: 'center' });
      }

      // Ministry of Health text (left side)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MINISTÉRIO DA SAÚDE', margin + 32, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('República de Angola', margin + 32, 27);
      doc.setFontSize(8);
      doc.text('Instituto Nacional de Saúde Pública', margin + 32, 34);

      // System Logo (Vacina Já - right side)
      try {
        const logo = '/logo.jpeg';
        doc.addImage(logo, 'JPEG', pageWidth - margin - 30, 12, 30, 26);
      } catch (e) {
        // Fallback if logo not found
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(pageWidth - margin - 30, 12, 30, 26, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('VJ', pageWidth - margin - 15, 28, { align: 'center' });
      }

      // System title (right side)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('VACINA JÁ', pageWidth - margin - 15, 42, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Vacinação', pageWidth - margin - 15, 47, { align: 'center' });

      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      yPos = 60;

      // Report title and date
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-AO')}`, margin, yPos);
      yPos += 15;

      // Draw line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Data table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      if ((type === 'vaccinations' || type === 'daily' || type === 'monthly') && data.length > 0) {
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text('Paciente', margin + 2, yPos + 2);
        doc.text('Vacina', margin + 55, yPos + 2);
        doc.text('Data', margin + 105, yPos + 2);
        doc.text('Hora', margin + 140, yPos + 2);
        doc.text('Enfermeiro', margin + 165, yPos + 2);
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        data.slice(0, 30).forEach((item: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
          }
          
          doc.text(String(item.paciente_nome || item.patient_nome || '-').substring(0, 22), margin + 2, yPos);
          doc.text(String(item.vacina_nome || item.vaccine_nome || item.nome || '-').substring(0, 20), margin + 55, yPos);
          doc.text(item.data_administracao ? new Date(item.data_administracao).toLocaleDateString('pt-AO') : '-', margin + 105, yPos);
          doc.text(String(item.hora_administracao || '-').substring(0, 8), margin + 140, yPos);
          doc.text(String(item.enfermeiro_nome || item.nome_completo || '-').substring(0, 15), margin + 165, yPos);
          yPos += 8;
        });
      } else if (type === 'coverage' && data.length > 0) {
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text('Nome', margin + 2, yPos + 2);
        doc.text('Data Nasc.', margin + 70, yPos + 2);
        doc.text('Telefone', margin + 110, yPos + 2);
        doc.text('Sexo', margin + 160, yPos + 2);
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        data.slice(0, 30).forEach((item: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
          }
          
          doc.text(String(item.nome_completo || '-').substring(0, 30), margin + 2, yPos);
          doc.text(item.data_nascimento ? new Date(item.data_nascimento).toLocaleDateString('pt-AO') : '-', margin + 70, yPos);
          doc.text(String(item.telefone || '-').substring(0, 15), margin + 110, yPos);
          doc.text(String(item.sexo || '-').substring(0, 5), margin + 160, yPos);
          yPos += 8;
        });
      } else if (type === 'stock' && data.length > 0) {
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text('Vacina', margin + 2, yPos + 2);
        doc.text('Fabricante', margin + 60, yPos + 2);
        doc.text('Doses', margin + 110, yPos + 2);
        doc.text('Expira', margin + 145, yPos + 2);
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        data.slice(0, 30).forEach((item: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
          }
          
          doc.text(String(item.nome || '-').substring(0, 25), margin + 2, yPos);
          doc.text(String(item.fabricante || '-').substring(0, 20), margin + 60, yPos);
          doc.text(String(item.quantidade_total || item.doses_disponiveis || '-'), margin + 110, yPos);
          doc.text(item.data_expiracao ? new Date(item.data_expiracao).toLocaleDateString('pt-AO') : '-', margin + 145, yPos);
          yPos += 8;
        });
      } else if (type === 'waste' && data.length > 0) {
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text('Vacina', margin + 2, yPos + 2);
        doc.text('Lote', margin + 55, yPos + 2);
        doc.text('Perdida', margin + 100, yPos + 2);
        doc.text('Motivo', margin + 135, yPos + 2);
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        data.slice(0, 30).forEach((item: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
          }
          
          doc.text(String(item.vacina_nome || item.nome || '-').substring(0, 22), margin + 2, yPos);
          doc.text(String(item.lote || '-').substring(0, 18), margin + 55, yPos);
          doc.text(String(item.quantidade_perdida || '0'), margin + 100, yPos);
          doc.text(String(item.motivo_perda || '-').substring(0, 20), margin + 135, yPos);
          yPos += 8;
        });
      } else if (type === 'coverage' && data.length > 0) {
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text('Grupo Alvo', margin + 2, yPos + 2);
        doc.text('Vacinados', margin + 70, yPos + 2);
        doc.text('Total Pacientes', margin + 120, yPos + 2);
        doc.text('Cobertura %', margin + 165, yPos + 2);
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        data.slice(0, 30).forEach((item: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
          }
          
          const cobertura = item.total_pacientes > 0 ? 
            ((item.total_vacinados / item.total_pacientes) * 100).toFixed(1) + '%' : '0%';
          doc.text(String(item.grupo_alvo || '-').substring(0, 25), margin + 2, yPos);
          doc.text(String(item.total_vacinados || '0'), margin + 70, yPos);
          doc.text(String(item.total_pacientes || '0'), margin + 120, yPos);
          doc.text(cobertura, margin + 165, yPos);
          yPos += 8;
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('Não foram encontrados dados para este relatório.', margin, yPos);
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount} | Vacina Já - Sistema de Vacinação`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar relatório. Por favor, tente novamente.');
    }
  };

  const fetchProfile = async (id: number) => {
    try {
      const res = await apiFetch(`/api/users/profile/${id}`);
      const data = await res.json();
      setUser(data);
      setFormData({
        ...formData,
        nome_completo: data.nome_completo,
        email: data.email || '',
        profile_picture: data.profile_picture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As palavras-passe não coincidem' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch(`/api/users/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: formData.nome_completo,
          email: formData.email,
          profile_picture: formData.profile_picture,
          password: formData.password || undefined
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        // Update local storage
        const updatedUser = { ...user, nome_completo: formData.nome_completo, profile_picture: formData.profile_picture };
        localStorage.setItem('vacina_ja_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Notify other components
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">O Meu Perfil</h2>
        <p className="text-slate-500 font-medium">Gerencie suas informações pessoais e segurança.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={18} />
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'notifications' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell size={18} />
          Notificações
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} />
          Relatórios
        </button>
      </div>

      {activeTab === 'profile' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Avatar */}
        <div className="lg:col-span-1">
          <div className="card p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <div className="w-40 h-40 bg-blue-50 rounded-[40px] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={80} className="text-blue-600" strokeWidth={1.5} />
                )}
              </div>
              <label className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{user.nome_completo}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
              <div className="mt-4 px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-10 space-y-8">
            {message && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    className="input-field pl-12" 
                    value={formData.nome_completo}
                    onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email"
                    className="input-field pl-12" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h4 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                <Lock size={20} className="text-blue-600" /> Alterar Palavra-passe
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nova Senha</label>
                  <input 
                    type="password"
                    className="input-field" 
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <input 
                    type="password"
                    className="input-field" 
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400 font-medium italic">Deixe em branco se não desejar alterar a senha.</p>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary px-12 flex items-center gap-2"
              >
                {saving ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-blue-600" />
            Minhas Notificações
          </h3>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">Sem notificações</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    notif.read ? 'bg-slate-50 border-slate-100' : 'bg-blue-50 border-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />}
                      <div>
                        <p className="font-bold text-slate-900">{notif.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(notif.created_at).toLocaleString('pt-AO')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                          title="Marcar como lida"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="card p-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            Gerar Relatórios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => generateReport('daily')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border-2 border-blue-200 hover:border-blue-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Diário</h4>
              <p className="text-sm text-slate-500">Relatório de vaccinations do dia</p>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>
            
            <button
              onClick={() => generateReport('monthly')}
              className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl border-2 border-indigo-200 hover:border-indigo-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Mensal</h4>
              <p className="text-sm text-slate-500">Relatório de vaccinations do mês</p>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>

            <button
              onClick={() => generateReport('coverage')}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl border-2 border-purple-200 hover:border-purple-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Cobertura Vacinal</h4>
              <p className="text-sm text-slate-500">Relatório de cobertura por grupo</p>
              <div className="mt-4 flex items-center gap-2 text-purple-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>

            <button
              onClick={() => generateReport('waste')}
              className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-3xl border-2 border-rose-200 hover:border-rose-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Desperdício</h4>
              <p className="text-sm text-slate-500">Relatório de vaccines perdidas</p>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>
            
            <button
              onClick={() => generateReport('patients')}
              className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl border-2 border-emerald-200 hover:border-emerald-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <User size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Pacientes</h4>
              <p className="text-sm text-slate-500">Relatório de todos os pacientes</p>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>
            
            <button
              onClick={() => generateReport('stock')}
              className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl border-2 border-amber-200 hover:border-amber-400 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-1">Stock</h4>
              <p className="text-sm text-slate-500">Relatório do stock de vaccines</p>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm">
                <Download size={16} /> Baixar
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
