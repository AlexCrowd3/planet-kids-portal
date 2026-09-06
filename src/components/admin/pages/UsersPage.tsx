import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, UserCheck, UserX, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ParentUserModal from '../modals/ParentUserModal';
import TeacherUserModal from '../modals/TeacherUserModal';
import UserFilters from '../modals/UserFilters';

export type UserRole = 'parent' | 'teacher';

export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string | null;
  avatar: string | null;
  bonus_points: number;
  is_phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: UserRole;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as User[];
    },
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name ?? ''}`.trim().toLowerCase();
      const reverseName = `${user.last_name ?? ''} ${user.first_name}`.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        user.first_name.toLowerCase().includes(normalizedSearch) ||
        (user.last_name ?? '').toLowerCase().includes(normalizedSearch) ||
        fullName.includes(normalizedSearch) ||
        reverseName.includes(normalizedSearch) ||
        user.phone.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && user.is_phone_verified) ||
        (verificationFilter === 'unverified' && !user.is_phone_verified);

      return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    });

    return [...result].sort((a, b) => {
      if (sort === 'name') {
        return `${a.first_name} ${a.last_name ?? ''}`.localeCompare(`${b.first_name} ${b.last_name ?? ''}`, 'ru');
      }

      if (sort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [users, search, roleFilter, statusFilter, verificationFilter, sort]);

  const statistics = useMemo(() => {
    const total = users.length;
    const parents = users.filter((user) => user.role === 'parent').length;
    const teachers = users.filter((user) => user.role === 'teacher').length;
    const active = users.filter((user) => user.is_active).length;
    const verified = users.filter((user) => user.is_phone_verified).length;

    return {
      total,
      parents,
      teachers,
      active,
      verified,
    };
  }, [users]);

  const handleUserUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
  };

  return (
    <div className="min-h-full bg-white p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Пользователи</h1>
            <p className="mt-1 text-sm text-slate-500">Управление родителями, преподавателями и их данными</p>
          </div>

          <button onClick={() => refetch()} disabled={isFetching} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#646cff]/30 hover:text-[#646cff] disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={<Users className="h-5 w-5" />} title="Всего" value={statistics.total} />
          <StatCard icon={<UserCheck className="h-5 w-5" />} title="Родители" value={statistics.parents} />
          <StatCard icon={<ShieldCheck className="h-5 w-5" />} title="Преподаватели" value={statistics.teachers} />
          <StatCard icon={<UserCheck className="h-5 w-5" />} title="Активные" value={statistics.active} />
          <StatCard icon={<ShieldCheck className="h-5 w-5" />} title="Телефон подтверждён" value={statistics.verified} />
        </div>

        <UserFilters
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          verificationFilter={verificationFilter}
          setVerificationFilter={setVerificationFilter}
          sort={sort}
          setSort={setSort}
        />

        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-5">
                  <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-100 md:block" />
                  <div className="hidden h-6 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <UserX className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <h2 className="font-semibold text-red-900">Не удалось загрузить пользователей</h2>
            <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : 'Произошла ошибка'}</p>
            <button onClick={() => refetch()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
              Попробовать снова
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-semibold text-slate-900">Список пользователей</p>
                <p className="text-xs text-slate-500">Найдено: {filteredUsers.length}</p>
              </div>

              {search && (
                <div className="hidden items-center gap-2 rounded-lg bg-[#646cff]/5 px-3 py-2 text-xs text-[#646cff] sm:flex">
                  <Search className="h-3.5 w-3.5" />
                  Поиск: «{search}»
                </div>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <h3 className="font-medium text-slate-800">Пользователи не найдены</h3>
                <p className="mt-1 text-sm text-slate-500">Попробуй изменить параметры поиска или фильтры</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-4">Пользователь</th>
                        <th className="px-5 py-4">Телефон</th>
                        <th className="px-5 py-4">Роль</th>
                        <th className="px-5 py-4">Баллы</th>
                        <th className="px-5 py-4">Статус</th>
                        <th className="px-5 py-4">Регистрация</th>
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <UserRow key={user.id} user={user} onClick={() => setSelectedUser(user)} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredUsers.map((user) => (
                    <button key={user.id} onClick={() => setSelectedUser(user)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50">
                      <UserAvatar user={user} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{user.first_name} {user.last_name ?? ''}</p>
                        <p className="truncate text-sm text-slate-500">{user.phone}</p>
                      </div>

                      <div className="text-right">
                        <RoleBadge role={user.role} />
                        <p className="mt-1 text-xs text-slate-400">{user.bonus_points} баллов</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectedUser?.role === 'parent' && (
        <ParentUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdated={handleUserUpdated} />
      )}

      {selectedUser?.role === 'teacher' && (
        <TeacherUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdated={handleUserUpdated} />
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#646cff]/10 text-[#646cff]">
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function UserAvatar({ user }: { user: User }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />;
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#646cff]/10 text-sm font-bold text-[#646cff]">
      {user.first_name.charAt(0).toUpperCase()}
      {user.last_name?.charAt(0).toUpperCase() ?? ''}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return role === 'teacher' ? (
    <span className="inline-flex rounded-full bg-[#646cff]/10 px-2.5 py-1 text-xs font-medium text-[#646cff]">Преподаватель</span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Родитель</span>
  );
}

function UserRow({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{user.first_name} {user.last_name ?? ''}</p>
            <p className="text-xs text-slate-400">{user.id.slice(0, 8)}...</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          {user.phone}
          {user.is_phone_verified && <span className="text-emerald-500">✓</span>}
        </div>
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-5 py-4 text-sm font-medium text-slate-700">
        {user.bonus_points}
      </td>

      <td className="px-5 py-4">
        {user.is_active ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Активен</span>
        ) : (
          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">Заблокирован</span>
        )}
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {new Date(user.created_at).toLocaleDateString('ru-RU')}
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-medium text-[#646cff]">Открыть →</span>
      </td>
    </tr>
  );
}