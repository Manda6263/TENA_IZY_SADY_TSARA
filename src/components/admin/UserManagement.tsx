import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { User } from '../../types/auth';
import { useI18n } from '../../hooks/useI18n';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const { users, loading, createUser, updateUser, deleteUser, bulkUpdateUsers } = useAdmin();
  const { t, formatDate } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        await bulkUpdateUsers(selectedUsers, { isActive: true });
        break;
      case 'deactivate':
        await bulkUpdateUsers(selectedUsers, { isActive: false });
        break;
      case 'delete':
        if (confirm(t('admin.users.confirmBulkDelete', { count: selectedUsers.length }))) {
          for (const userId of selectedUsers) {
            await deleteUser(userId);
          }
        }
        break;
    }
    
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Username', 'Role', 'Status', 'Created At', 'Last Login'].join(','),
      ...filteredUsers.map(user => [
        user.email,
        user.username,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        formatDate(user.createdAt),
        user.lastLogin ? formatDate(user.lastLogin) : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('admin.users.subtitle')}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={exportUsers}
            className="btn btn-secondary flex items-center"
          >
            <Download size={16} className="mr-2" />
            {t('common.export')}
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            {t('admin.users.create')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 form-input"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-input"
          >
            <option value="">{t('admin.users.allRoles')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="manager">{t('roles.manager')}</option>
            <option value="seller">{t('roles.seller')}</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="">{t('admin.users.allStatuses')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              disabled={selectedUsers.length === 0}
              className="btn btn-secondary flex items-center disabled:opacity-50"
            >
              <MoreVertical size={16} className="mr-2" />
              {t('admin.users.bulkActions')}
            </button>
          </div>
        </div>
        
        {/* Bulk Actions */}
        <AnimatePresence>
          {showBulkActions && selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('admin.users.selectedCount', { count: selectedUsers.length })}
                </span>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="btn btn-sm btn-success"
                  >
                    {t('admin.users.activate')}
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="btn btn-sm btn-warning"
                  >
                    {t('admin.users.deactivate')}
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="btn btn-sm btn-danger"
                  >
                    {t('admin.users.delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th>{t('admin.users.user')}</th>
                <th>{t('admin.users.role')}</th>
                <th>{t('admin.users.status')}</th>
                <th>{t('admin.users.lastLogin')}</th>
                <th>{t('admin.users.created')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-danger' :
                        user.role === 'manager' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {t(`roles.${user.role}`)}
                      </span>
                    </td>
                    
                    <td>
                      <div className="flex items-center space-x-2">
                        {user.isActive ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                          {user.isActive ? t('status.active') : t('status.inactive')}
                        </span>
                      </div>
                    </td>
                    
                    <td className="text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin ? formatDate(user.lastLogin) : t('admin.users.neverLoggedIn')}
                    </td>
                    
                    <td className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title={t('common.edit')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('admin.users.confirmDelete'))) {
                              deleteUser(user.id);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('admin.users.noUsers')}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <UserModal
        user={editingUser}
        isOpen={showCreateModal || !!editingUser}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSave={async (userData) => {
          if (editingUser) {
            await updateUser(editingUser.id, userData);
          } else {
            await createUser(userData);
          }
          setShowCreateModal(false);
          setEditingUser(null);
        }}
      />
    </div>
  );
};

// User Modal Component
interface UserModalProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: 'seller' as const,
    isActive: true,
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    }
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile || { firstName: '', lastName: '', phone: '' }
      });
    } else {
      setFormData({
        email: '',
        username: '',
        role: 'seller',
        isActive: true,
        profile: { firstName: '', lastName: '', phone: '' }
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      toast.success(user ? t('admin.users.updated') : t('admin.users.created'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {user ? t('admin.users.editUser') : t('admin.users.createUser')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">{t('admin.users.email')} *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
              disabled={!!user}
            />
          </div>
          
          <div>
            <label className="form-label">{t('admin.users.username')} *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="form-input"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('admin.users.firstName')}</label>
              <input
                type="text"
                value={formData.profile.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, firstName: e.target.value }
                })}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">{t('admin.users.lastName')}</label>
              <input
                type="text"
                value={formData.profile.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, lastName: e.target.value }
                })}
                className="form-input"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">{t('admin.users.phone')}</label>
            <input
              type="tel"
              value={formData.profile.phone}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, phone: e.target.value }
              })}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">{t('admin.users.role')} *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="form-input"
              required
            >
              <option value="seller">{t('roles.seller')}</option>
              <option value="manager">{t('roles.manager')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              {t('admin.users.activeAccount')}
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? t('common.saving') : (user ? t('common.update') : t('common.create'))}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserManagement;