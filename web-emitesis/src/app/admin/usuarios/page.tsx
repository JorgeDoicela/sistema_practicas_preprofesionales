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
  FileSpreadsheet
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { User, UserRole } from "@/types/user";
import { TwoFactorModal } from '@/components/auth/TwoFactorModal';
import { DoubleConfirmModal, useDoubleConfirm } from '@/components/ui/DoubleConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

const RoleBadge = ({ role }: { role: UserRole | string }) => {
  const { t } = useLanguage();
  const styles: Record<string, string> = {
    ADMIN: 'text-red-700',
    COORDINADOR: 'text-blue-700',
    TUTOR: 'text-green-700',
    ESTUDIANTE: 'text-purple-700',
    EMPRESA: 'text-indigo-700',
  };

  const roleLabel = t.sidebar.roles[role as keyof typeof t.sidebar.roles] || role;

  return (
    <span className={`text-[10px] font-black uppercase tracking-widest ${styles[role] || 'text-slate-700'}`}>
      {roleLabel}
    </span>
  );
};

export default function UsuariosManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic filter states
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [roleCountsState, setRoleCountsState] = useState<Record<string, number>>({
    ADMIN: 0,
    COORDINADOR: 0,
    TUTOR: 0,
    ESTUDIANTE: 0,
    EMPRESA: 0,
  });
  const [statusCountsState, setStatusCountsState] = useState<{ active: number; inactive: number }>({
    active: 0,
    inactive: 0,
  });

  // Pagination & limits
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25); // Defaults to 25 to show a rich dataset initially
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
      toast.success(
        t.admin.users.bulkSuccess
          .replace('{created}', String(result.summary.created))
          .replace('{skipped}', String(result.summary.skipped))
      );
      fetchData(currentPage, limit);
    } catch (err: unknown) {
      toast.error((err as Error).message || t.admin.users.toastError);
    } finally {
      setIsBulkLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const fetchData = async (
    page = currentPage,
    currentLimit = limit,
    search = searchTerm,
    role = selectedRole,
    status = selectedStatus
  ) => {
    try {
      setLoading(true);
      const res: any = await usersService.findAll(page, currentLimit, search, role, status);
      const userList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const total = res?.meta?.total ?? userList.length;
      const lastPage = res?.meta?.lastPage ?? 1;

      setUsers(userList);
      setTotalItems(total);
      setTotalPages(lastPage);

      if (res?.meta?.roleCounts) {
        setRoleCountsState(res.meta.roleCounts);
      }
      if (res?.meta?.statusCounts) {
        setStatusCountsState(res.meta.statusCounts);
      }

      if (page > lastPage && lastPage > 0) {
        setCurrentPage(lastPage);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, limit, searchTerm, selectedRole, selectedStatus);
  }, [currentPage, limit, selectedRole, selectedStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, limit, searchTerm, selectedRole, selectedStatus);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
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
        toast.success(t.admin.users.toastUpdateSuccess);
      } else {
        await usersService.create(form);
        toast.success(t.admin.users.toastCreateSuccess);
      }
      setIsModalOpen(false);
      fetchData(currentPage, limit);
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || t.admin.users.toastError;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersService.update(user.id, { isActive: !user.isActive });
      toast.success(t.admin.users.toastStatusSuccess);
      fetchData(currentPage, limit);
    } catch (err: unknown) {
      toast.error((err as Error).message || t.admin.users.toastError);
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
      toast.success(t.admin.users.toastDeleteSuccess);
      deleteConfirm.close();
      fetchData(currentPage, limit);
    } catch (err: unknown) {
      toast.error((err as Error).message || t.admin.users.toastError);
    } finally {
      setDeletingUser(false);
    }
  };

  const confirmDeleteWith2fa = async (code: string) => {
    if (!pendingDeleteId) return;
    try {
      await usersService.remove(pendingDeleteId, code);
      toast.success(t.admin.users.toastDeleteSuccess);
      fetchData(currentPage, limit);
      setIs2faModalOpen(false);
      setPendingDeleteId(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || t.admin.users.toastError);
      throw err;
    }
  };

  // Reducer stats based on loaded users
  const roleCounts = roleCountsState;

  const statusCounts = statusCountsState;

  // Combined advanced filtering (done server-side now)
  const filteredUsers = users;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#003366] text-[10px] font-bold uppercase tracking-widest mb-4">
              <Shield size={12} /> {t.admin.users.systemAdmin}
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight">{t.admin.users.title}</h1>
            <p className="text-slate-500 mt-2 font-medium">{t.admin.users.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4" data-tour="users-new">
            <div className="relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx, .xls"
                onChange={handleBulkUpload}
                disabled={isBulkLoading}
              />
              <button 
                className="flex items-center gap-3 bg-white text-[#003366] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
              >
                {isBulkLoading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} className="text-[#C5A059]" />}
                {t.admin.users.bulkUpload}
              </button>
            </div>

            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-3 bg-[#003366] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:translate-y-[-2px] transition-all"
            >
              <Plus size={18} /> {t.admin.users.newUser}
            </button>
          </div>
        </div>

        {/* Search & Advanced Filters panel */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6" data-tour="users-search">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t.admin.users.searchPlaceholder}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-[#003366]/10 focus:bg-white transition-all outline-none font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {(searchTerm || selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('ALL');
                  setSelectedStatus('ALL');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all self-start md:self-auto"
              >
                <X size={14} />
                {t.common.clearFilters}
              </button>
            )}
          </div>

          <div className="border-t border-slate-50 pt-5 flex flex-col gap-5">
            {/* Filter by Role */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.roleLabel}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedRole('ALL'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    selectedRole === 'ALL'
                      ? 'bg-[#003366] text-white border-[#003366] shadow-md shadow-blue-900/10'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                  }`}
                >
                  {t.common.all}
                  <span className="ml-1 opacity-60 text-[10px]">
                    ({totalItems})
                  </span>
                </button>
                {(['ADMIN', 'COORDINADOR', 'TUTOR', 'ESTUDIANTE', 'EMPRESA'] as UserRole[]).map((r) => {
                  const label = t.sidebar.roles[r] || r;
                  const count = roleCounts[r] || 0;
                  return (
                    <button
                      key={r}
                      onClick={() => { setSelectedRole(r); setCurrentPage(1); }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                        selectedRole === r
                          ? 'bg-[#003366] text-white border-[#003366] shadow-md shadow-blue-900/10'
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {label}
                      <span className="ml-1 opacity-60 text-[10px]">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Status */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.status}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    selectedStatus === 'ALL'
                      ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-md shadow-amber-900/10'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                  }`}
                >
                  {t.common.all}
                </button>
                <button
                  onClick={() => { setSelectedStatus('ACTIVE'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    selectedStatus === 'ACTIVE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/10'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedStatus === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'}`} />
                  {t.common.active}
                  <span className="ml-1 opacity-60 text-[10px]">
                    ({statusCounts.active})
                  </span>
                </button>
                <button
                  onClick={() => { setSelectedStatus('INACTIVE'); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    selectedStatus === 'INACTIVE'
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-900/10'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedStatus === 'INACTIVE' ? 'bg-white' : 'bg-red-500'}`} />
                  {t.common.inactive}
                  <span className="ml-1 opacity-60 text-[10px]">
                    ({statusCounts.inactive})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden" data-tour="users-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.user}</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.role}</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.status}</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.registration}</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">{t.admin.users.table.actions}</th>
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
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                      {t.admin.users.noUsers}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#003366] font-black text-xs uppercase group-hover:scale-105 transition-transform">
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
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${
                          user.isActive ? 'text-emerald-700' : 'text-red-700'
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

          {/* Table Footer with Pagination */}
          <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span>{t.common.show}</span>
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#003366]/10 text-[#003366] font-black cursor-pointer transition-all"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>{t.common.all}</option>
              </select>
              <span>{t.admin.careers.users || 'usuarios'}</span>
              <span className="text-slate-300">|</span>
              <span>
                {t.common.showing} {totalItems === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalItems)} {t.common.of} {totalItems}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500 hover:text-[#003366] disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50 transition-all"
              >
                {t.common.previous}
              </button>
              
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (totalPages > 5 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="text-slate-300 px-0.5 text-xs">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === p 
                          ? 'bg-[#003366] text-white shadow-md shadow-blue-900/10' 
                          : 'bg-white border border-slate-100 text-slate-500 hover:text-[#003366] hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500 hover:text-[#003366] disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50 transition-all"
              >
                {t.common.next}
              </button>
            </div>
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

              <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.table.user}</label>
                  <input 
                    type="text" 
                    required 
                    value={form.fullName}
                    onChange={(e) => setForm({...form, fullName: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
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
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
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
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.admin.users.roleLabel}</label>
                  <select 
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value as UserRole})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-black text-slate-700"
                  >
                    <option value="ESTUDIANTE">{t.sidebar.roles.ESTUDIANTE}</option>
                    <option value="TUTOR">{t.sidebar.roles.TUTOR}</option>
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
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
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
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
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
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#003366]/5 outline-none font-medium"
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
                    className="w-full bg-[#003366] text-white rounded-2xl py-5 text-[10px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3"
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
