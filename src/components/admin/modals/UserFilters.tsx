import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { UserRole } from '../pages/UsersPage';

interface UserFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  roleFilter: 'all' | UserRole;
  setRoleFilter: (value: 'all' | UserRole) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (value: 'all' | 'active' | 'inactive') => void;
  verificationFilter: 'all' | 'verified' | 'unverified';
  setVerificationFilter: (value: 'all' | 'verified' | 'unverified') => void;
  sort: 'newest' | 'oldest' | 'name';
  setSort: (value: 'newest' | 'oldest' | 'name') => void;
}

export default function UserFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  verificationFilter,
  setVerificationFilter,
  sort,
  setSort,
}: UserFiltersProps) {
  const hasFilters =
    search ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    verificationFilter !== 'all' ||
    sort !== 'newest';

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setVerificationFilter('all');
    setSort('newest');
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по имени, фамилии или телефону..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#646cff]/40 focus:bg-white focus:ring-4 focus:ring-[#646cff]/10" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10">
            <option value="all">Все роли</option>
            <option value="parent">Родители</option>
            <option value="teacher">Преподаватели</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10">
            <option value="all">Любой статус</option>
            <option value="active">Активные</option>
            <option value="inactive">Заблокированные</option>
          </select>

          <select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value as 'all' | 'verified' | 'unverified')} className="hidden h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10 lg:block">
            <option value="all">Телефон</option>
            <option value="verified">Подтверждён</option>
            <option value="unverified">Не подтверждён</option>
          </select>

          <select value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest' | 'name')} className="hidden h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10 sm:block">
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="name">По имени</option>
          </select>

          {hasFilters && (
            <button onClick={resetFilters} className="h-11 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-[#646cff] transition hover:bg-[#646cff]/5">
              Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}