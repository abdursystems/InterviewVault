import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  ArrowLeftRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatShortDate } from '../../utils/diagnostics';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import { useAdminToast } from './AdminLayout';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { addToast } = useAdminToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state: { type: 'role' | 'active' | 'delete', target: user }
  const [modalAction, setModalAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [deleteBlocked409, setDeleteBlocked409] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await adminAPI.getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load user directory.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && u.isActive === false) return false;
      if (statusFilter === 'disabled' && u.isActive !== false) return false;
      if (
        term &&
        !(
          (u.name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u._id || '').toLowerCase().includes(term)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const closeModal = () => {
    setModalAction(null);
    setActionError('');
    setDeleteBlocked409(false);
  };

  const handleConfirmModal = async () => {
    if (!modalAction) return;
    const { type, target } = modalAction;
    setActionLoading(true);
    setActionError('');
    setDeleteBlocked409(false);

    try {
      if (type === 'role') {
        const nextRole = target.role === 'Admin' ? 'Student' : 'Admin';
        await adminAPI.updateUserRole(target._id, nextRole);
        addToast(`Updated ${target.name}'s role to ${nextRole}.`, 'success');
        closeModal();
        await fetchUsers();
      } else if (type === 'active') {
        const nextActive = target.isActive === false;
        await adminAPI.updateUserActive(target._id, nextActive);
        addToast(
          nextActive
            ? `Re-activated ${target.name}'s account.`
            : `Disabled ${target.name}'s account and revoked active sessions.`,
          nextActive ? 'success' : 'warning'
        );
        closeModal();
        await fetchUsers();
      } else if (type === 'delete') {
        await adminAPI.deleteUser(target._id);
        addToast(`Deleted account for ${target.name}.`, 'success');
        closeModal();
        await fetchUsers();
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = getApiErrorMessage(err, 'Action failed.');
      setActionError(msg);
      if (type === 'delete' && status === 409) {
        setDeleteBlocked409(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleFallbackDisableInstead = async () => {
    if (!modalAction?.target) return;
    setFallbackLoading(true);
    try {
      await adminAPI.updateUserActive(modalAction.target._id, false);
      addToast(
        `Disabled ${modalAction.target.name}'s account instead of deleting to preserve attempt history.`,
        'warning'
      );
      closeModal();
      await fetchUsers();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to disable account.'));
    } finally {
      setFallbackLoading(false);
    }
  };

  const modalCopy = useMemo(() => {
    if (!modalAction) return null;
    const { type, target } = modalAction;

    if (type === 'role') {
      const nextRole = target.role === 'Admin' ? 'Student' : 'Admin';
      return {
        title: `Change role for ${target.name}?`,
        description:
          nextRole === 'Admin'
            ? 'Granting Admin privileges allows this user to manage questions, subtopics, and user accounts.'
            : 'Demoting this account to Student immediately revokes access to the Admin Console.',
        detail: `${target.email} · ID: ${target._id} · ${target.role} → ${nextRole}`,
        confirmLabel: `Switch to ${nextRole}`,
        variant: 'primary',
      };
    }

    if (type === 'active') {
      const willActivate = target.isActive === false;
      return {
        title: willActivate ? `Re-activate ${target.name}?` : `Disable ${target.name}'s account?`,
        description: willActivate
          ? 'This user will be able to sign in and resume technical interview practice.'
          : 'Disabling an account immediately revokes active sessions and blocks future sign-ins while preserving diagnostic attempt records.',
        detail: `${target.email} · ID: ${target._id} · Currently ${target.isActive === false ? 'Disabled' : 'Active'}`,
        confirmLabel: willActivate ? 'Re-activate Account' : 'Disable Account',
        variant: willActivate ? 'primary' : 'warning',
      };
    }

    return {
      title: `Delete ${target.name}'s account?`,
      description:
        'Only accounts with zero recorded attempts can be permanently deleted. Accounts with existing attempts must be disabled instead.',
      detail: `${target.email} · ID: ${target._id} · Role: ${target.role}`,
      confirmLabel: 'Delete Account',
      variant: 'danger',
    };
  }, [modalAction]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Access Governance
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          User Management
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Manage user roles, suspend or restore account access, and audit account status. Your own
          administrator account is self-protected against modification.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or account ID..."
            aria-label="Search users"
            className="w-full h-9 pl-8.5 pr-8 rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="h-9 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>

        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums sm:ml-1">
          {filteredUsers.length} of {users.length}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden">
        <div className="overflow-x-auto" data-lenis-prevent>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/80 dark:bg-[#141418] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-2.5 px-4 font-medium">User</th>
                <th className="py-2.5 px-3 font-medium">Account ID</th>
                <th className="py-2.5 px-3 font-medium">Email</th>
                <th className="py-2.5 px-3 font-medium">Role</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Joined</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-4 w-full rounded skeleton-shimmer" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-zinc-500 dark:text-zinc-400">
                    No user accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((row) => {
                  const isSelf = row._id === currentUser?._id;
                  const isActive = row.isActive !== false;
                  return (
                    <tr
                      key={row._id}
                      data-testid={isSelf ? 'admin-self-row' : `admin-user-row-${row._id}`}
                      className="hover:bg-zinc-50/80 dark:hover:bg-[#18181B]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {row.profileImageUrl ? (
                            <img
                              src={row.profileImageUrl}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover border border-zinc-200 dark:border-[#27272A] shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                              {getInitials(row.name)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {row.name}
                            </span>
                            {isSelf && (
                              <span
                                data-testid="self-you-badge"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25 shrink-0"
                              >
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {row._id}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        {row.email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                            row.role === 'Admin'
                              ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25'
                              : 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#18181B] border-zinc-200 dark:border-[#27272A]'
                          }`}
                        >
                          {row.role === 'Admin' && (
                            <Shield className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{row.role}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                            isActive
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                              : 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
                          }`}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatShortDate(row.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'You cannot change your own role'
                                : `Switch role to ${row.role === 'Admin' ? 'Student' : 'Admin'}`
                            }
                            onClick={() => {
                              setActionError('');
                              setDeleteBlocked409(false);
                              setModalAction({ type: 'role', target: row });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#27272A] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden xl:inline">Role</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'You cannot disable your own account'
                                : isActive
                                ? 'Disable account'
                                : 'Re-activate account'
                            }
                            onClick={() => {
                              setActionError('');
                              setDeleteBlocked409(false);
                              setModalAction({ type: 'active', target: row });
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-colors ${
                              isActive
                                ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="hidden xl:inline">Disable</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="hidden xl:inline">Enable</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            title={
                              isSelf ? 'You cannot delete your own account' : 'Delete account'
                            }
                            onClick={() => {
                              setActionError('');
                              setDeleteBlocked409(false);
                              setModalAction({ type: 'delete', target: row });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden xl:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal with 409 "Disable Account Instead" Fallback */}
      <ConfirmActionModal
        isOpen={Boolean(modalAction && modalCopy)}
        title={modalCopy?.title || ''}
        description={modalCopy?.description || ''}
        detail={modalCopy?.detail || ''}
        confirmLabel={modalCopy?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        variant={modalCopy?.variant || 'primary'}
        loading={actionLoading}
        error={actionError}
        fallbackAction={
          deleteBlocked409 && modalAction?.target?.isActive !== false
            ? {
                label: 'Disable Account Instead',
                onClick: handleFallbackDisableInstead,
                loading: fallbackLoading,
              }
            : null
        }
        onConfirm={handleConfirmModal}
        onCancel={closeModal}
      />
    </div>
  );
}
