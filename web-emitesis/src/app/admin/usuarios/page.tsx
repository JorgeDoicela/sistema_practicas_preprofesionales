'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  X,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { User, UserRole } from "@/types/user";
import { TwoFactorModal } from '@/components/auth/TwoFactorModal';
import { DoubleConfirmModal, useDoubleConfirm } from '@/components/ui/DoubleConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';

import { useLanguage } from '@/providers/LanguageProvider';

const RoleBadge = ({ role }: { role: UserRole | string }) => {
  const { t } = useLanguage();
  const styles: Record<string, string> = {
    ADMIN: 'bg-red-50 text-red-700 border-red-100',
    COORDINADOR: 'bg-blue-50 text-blue-700 border-blue-100',
    TUTOR: 'bg-green-50 text-green-700 border-green-100',
    TUTOR_ACADEMICO: 'bg-green-50 text-green-700 border-green-100',
    TUTOR_EMPRESARIAL: 'bg-teal-50 text-teal-800 border-teal-100',
    ESTUDIANTE: 'bg-purple-50 text-purple-700 border-purple-100',
    EMPRESA: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  const roleLabel = t.sidebar.roles[role as keyof typeof t.sidebar.roles] || role;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[role] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
      {roleLabel}
    </span>
  );
};

export default function UsuariosManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    cedula?: string;
    phone?: string;
    ciclo?: string;
  }>({
    fullName: '',
    email: '',
    password: '',
    role: 'ESTUDIANTE',
    isActive: true,
    cedula: '',
    phone: '',
    ciclo: '',
  });
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const deleteConfirm = useDoubleConfirm<string>();

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkLoading(true);
    try {
      const result = await usersService.bulkImport(file);
      alert(t.admin.users.bulkSuccess.replace('{created}', String(result.summary.created)).replace('{skipped}', String(result.summary.skipped)));
      fetchData();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsBulkLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await usersService.findAll();
      const userList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setUsers(userList);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        fullName: user.fullName,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive,
        cedula: (user as any).cedula || '',
        phone: (user as any).phone || '',
        ciclo: (user as any).ciclo || '',
      });
    } else {
      setEditingUser(null);
      setForm({
        fullName: '',
        email: '',
        password: '',
        role: 'ESTUDIANTE',
        cedula: '',
        phone: '',
        ciclo: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingUser) {
        await usersService.update(editingUser.id, form);
      } else {
        await usersService.create(form);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersService.update(user.id, { isActive: !user.isActive });
      fetchData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    deleteConfirm.openFor(id, user?.fullName || id);
  };

  const executeDelete = async () => {
    const id = deleteConfirm.pendingItem;
    if (!id) return;
    setDeletingUser(true);
    try {
      if (currentUser?.isTwoFactorEnabled) {
        setPendingDeleteId(id);
        deleteConfirm.close();
        setIs2faModalOpen(true);
        return;
      }
      await usersService.remove(id);
      deleteConfirm.close();
      fetchData();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setDeletingUser(false);
    }
  };

  const confirmDeleteWith2fa = async (code: string) => {
    if (!pendingDeleteId) return;
    try {
      await usersService.remove(pendingDeleteId, code);
      fetchData();
      setIs2faModalOpen(false);
      setPendingDeleteId(null);
    } catch (err: unknown) {
      throw err;
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003366]/5 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#003366]/10">
              <Shield size={12} /> {t.admin.users.systemAdmin}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#003366] tracking-tight">{t.admin.users.title}</h1>
            <p className="text-slate-500 mt-2">{t.admin.users.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx, .xls"
                onChange={handleBulkUpload}
                disabled={isBulkLoading}
              />
              <button 
                className="flex items-center gap-3 bg-slate-100 text-[#003366] px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              >
                {isBulkLoading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                {t.admin.users.bulkUpload}
              </button>
            </div>

            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-3 bg-[#003366] text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:translate-y-[-2px] transition-all"
            >
              <Plus size={18} /> {t.admin.users.newUser}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t.admin.users.searchPlaceholder}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.admin.users.table.user}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.admin.users.table.role}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.admin.users.table.status}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.admin.users.table.registration}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t.admin.users.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                      {t.admin.users.noUsers}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#003366] font-black text-xs uppercase">
                            {user.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#003366]">{user.fullName}</p>
                            <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                              <Mail size={12} />
                              <span className="text-[10px] font-medium">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.isActive ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[11px] text-slate-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? t.common.inactive : t.common.active}
                            className={`p-2 rounded-xl transition-all ${user.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                           >
                             {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                           </button>
                           <button 
                            onClick={() => handleOpenModal(user)}
                            title={t.common.edit}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                           >
                             <Edit size={18} />
                           </button>
                           <button 
                            onClick={() => handleDelete(user.id)}
                            title={t.common.delete}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal / Sidebar Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] mt-0"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-[#003366] tracking-tight">{editingUser ? t.admin.users.editUser : t.admin.users.newUser}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mt-1">{t.admin.users.profileConfig}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 items-start animate-shake">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.user}</label>
                  <input 
                    type="text" 
                    required 
                    value={form.fullName}
                    onChange={(e) => setForm({...form, fullName: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.email}</label>
                  <input 
                    type="email" 
                    required 
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                    placeholder="ejemplo@istpet.edu.ec"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400"> {editingUser ? t.admin.users.newPasswordOptional : t.admin.users.password}</label>
                  <input 
                    type="password" 
                    required={!editingUser} 
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.roleLabel}</label>
                  <select 
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value as UserRole})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none appearance-none"
                  >
                  >
                    <option value="ESTUDIANTE">{t.sidebar.roles.ESTUDIANTE}</option>
                    <option value="TUTOR">{t.sidebar.roles.TUTOR_ACADEMICO}</option>
                    <option value="COORDINADOR">{t.sidebar.roles.COORDINADOR}</option>
                    <option value="ADMIN">{t.sidebar.roles.ADMIN}</option>
                    <option value="EMPRESA">{t.sidebar.roles.EMPRESA}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.idCard}</label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={form.cedula}
                      onChange={(e) => setForm({...form, cedula: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      placeholder="Ej: 1712345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.phone}</label>
                    <input 
                      type="tel"
                      maxLength={15}
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                      placeholder="Ej: 0987654321"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.level} <span className="text-slate-300">{t.admin.users.levelHint}</span></label>
                  <input 
                    type="text"
                    maxLength={50}
                    value={form.ciclo}
                    onChange={(e) => setForm({...form, ciclo: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none"
                    placeholder="Ej: 5to Ciclo, Sexto Semestre"
                  />
                </div>

                <div className="flex items-center gap-3 py-4">
                   <input 
                    type="checkbox" 
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({...form, isActive: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-slate-300 text-[#003366] focus:ring-[#003366]" 
                   />
                   <label htmlFor="isActive" className="text-sm font-bold text-[#003366]">{t.admin.users.activeUser}</label>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    className="w-full bg-[#003366] text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3"
                  >
                    {editingUser ? t.admin.users.saveChanges : t.admin.users.createUser}
                    <UserPlus size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <TwoFactorModal 
        isOpen={is2faModalOpen}
        onClose={() => {
            setIs2faModalOpen(false);
            setPendingDeleteId(null);
        }}
        onConfirm={confirmDeleteWith2fa}
        title={t.admin.users.deleteTitle}
        description={t.admin.users.deleteConfirm}
      />

      {/* RF-19: Doble confirmación para eliminar usuario */}
      <DoubleConfirmModal
        {...deleteConfirm.modalProps}
        onConfirm={executeDelete}
        title={t.admin.users.deleteTitle}
        description={t.admin.users.deleteConfirm}
        confirmLabel={t.admin.users.deleteBtn}
        loading={deletingUser}
      />
    </DashboardLayout>
  );
}
