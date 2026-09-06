import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DirectionModal from '../modals/DirectionModal';

export type ActivityType = {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  subscription_type_id: string;
  duration_minutes: number;
  max_places: number;
  image: string | null;
  is_active: boolean;
  created_at: string;
};

export type Teacher = {
  id: string;
  first_name: string;
  last_name: string | null;
};

export type SubscriptionType = {
  id: string;
  name: string;
  level_value: number;
  base_price_per_lesson: number;
  teacher_payout_per_lesson: number;
  is_active: boolean;
  is_individual: boolean;
  min_lessons: number;
  max_lessons: number;
  max_price_per_lesson: number;
};

export default function DirectionsPage() {
  const [items, setItems] = useState<ActivityType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [selectedDirection, setSelectedDirection] = useState<ActivityType | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [activitiesRes, teachersRes, subscriptionsRes] = await Promise.all([
      supabase
        .from('activity_types')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('first_name', { ascending: true }),

      supabase
        .from('subscription_types')
        .select('*')
        .order('level_value', { ascending: true }),
    ]);

    if (activitiesRes.error) {
      setError(activitiesRes.error.message);
    } else {
      setItems((activitiesRes.data || []) as ActivityType[]);
    }

    if (teachersRes.error) {
      setError((prev) => prev || teachersRes.error.message);
    } else {
      setTeachers((teachersRes.data || []) as Teacher[]);
    }

    if (subscriptionsRes.error) {
      setError((prev) => prev || subscriptionsRes.error.message);
    } else {
      setSubscriptionTypes((subscriptionsRes.data || []) as SubscriptionType[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setSelectedDirection(null);
    setShowModal(true);
  };

  const handleEdit = (direction: ActivityType) => {
    setSelectedDirection(direction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDirection(null);
  };

  const handleSaved = async () => {
    handleCloseModal();
    await loadData();
  };

  const handleToggleActive = async (direction: ActivityType) => {
    setError(null);

    const { error: updateError } = await supabase
      .from('activity_types')
      .update({
        is_active: !direction.is_active,
      })
      .eq('id', direction.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === direction.id
          ? { ...item, is_active: !item.is_active }
          : item,
      ),
    );
  };

  const getTeacher = (teacherId: string) => {
    return teachers.find((teacher) => teacher.id === teacherId);
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = getTeacher(teacherId);

    if (!teacher) {
      return 'Преподаватель не найден';
    }

    return `${teacher.first_name}${teacher.last_name ? ` ${teacher.last_name}` : ''}`;
  };

  const getSubscription = (subscriptionId: string) => {
    return subscriptionTypes.find(
      (subscription) => subscription.id === subscriptionId,
    );
  };

  const getSubscriptionName = (subscriptionId: string) => {
    return getSubscription(subscriptionId)?.name ?? 'Тип подписки не найден';
  };

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return items.filter((item) => {
      if (!showInactive && !item.is_active) {
        return false;
      }

      if (!value) {
        return true;
      }

      const teacherName = getTeacherName(item.teacher_id).toLowerCase();
      const subscriptionName = getSubscriptionName(item.subscription_type_id).toLowerCase();

      return (
        item.name.toLowerCase().includes(value) ||
        (item.description ?? '').toLowerCase().includes(value) ||
        teacherName.includes(value) ||
        subscriptionName.includes(value)
      );
    });
  }, [items, search, showInactive, teachers, subscriptionTypes]);

  const activeCount = items.filter((item) => item.is_active).length;
  const inactiveCount = items.filter((item) => !item.is_active).length;

  return (
    <div className="min-h-full bg-white p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Направления
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Управление направлениями, преподавателями и параметрами занятий
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-[#646cff]/30 hover:text-[#646cff] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>

            <button
              onClick={handleCreate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-5 text-sm font-semibold text-white transition hover:bg-[#5558e8] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Добавить направление
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="Всего направлений"
            value={items.length}
            icon={<ImageIcon className="h-4 w-4" />}
          />

          <StatCard
            title="Активных"
            value={activeCount}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <StatCard
            title="Выключено"
            value={inactiveCount}
            icon={<ToggleLeft className="h-4 w-4" />}
          />

          <StatCard
            title="Преподавателей"
            value={teachers.length}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск направления, преподавателя или подписки..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#646cff]/40 focus:bg-white focus:ring-4 focus:ring-[#646cff]/10"
              />
            </div>

            <button
              onClick={() => setShowInactive((value) => !value)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                showInactive
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-[#646cff]/30 hover:text-[#646cff]'
                  : 'border-[#646cff]/20 bg-[#646cff]/5 text-[#646cff]'
              }`}
            >
              {showInactive ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {showInactive ? 'Скрыть выключенные' : 'Показать выключенные'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#646cff]/5 text-[#646cff]">
              <Search className="h-6 w-6" />
            </div>

            <h3 className="font-semibold text-slate-900">
              {items.length === 0 ? 'Направлений пока нет' : 'Ничего не найдено'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0
                ? 'Создай первое направление, чтобы оно появилось здесь'
                : 'Попробуй изменить поисковый запрос'}
            </p>

            {items.length === 0 && (
              <button
                onClick={handleCreate}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8]"
              >
                <Plus className="h-4 w-4" />
                Добавить направление
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => {
              const subscription = getSubscription(item.subscription_type_id);

              return (
                <DirectionCard
                  key={item.id}
                  item={item}
                  teacherName={getTeacherName(item.teacher_id)}
                  subscription={subscription}
                  onEdit={() => handleEdit(item)}
                  onToggle={() => handleToggleActive(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <DirectionModal
          direction={selectedDirection}
          teachers={teachers}
          subscriptionTypes={subscriptionTypes}
          onClose={handleCloseModal}
          onSaved={handleSaved}
          onError={setError}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{title}</p>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#646cff]/5 text-[#646cff]">
          {icon}
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DirectionCard({
  item,
  teacherName,
  subscription,
  onEdit,
  onToggle,
}: {
  item: ActivityType;
  teacherName: string;
  subscription?: SubscriptionType;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const isIndividual = subscription?.is_individual ?? false;

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-[#646cff]/20 hover:shadow-md">
      <div className="flex min-h-[220px]">
        <div className="relative w-[180px] shrink-0 overflow-hidden bg-slate-50">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-[#646cff]/5 text-[#646cff]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <span className="text-3xl font-bold">
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="absolute left-3 top-3">
            {item.is_active ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Активно
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Выключено
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900">
              {item.name}
            </h3>

            <p className="mt-1 truncate text-sm text-slate-500">
              {teacherName}
            </p>
          </div>

          {item.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
              {item.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {subscription && (
              <span
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                  isIndividual
                    ? 'bg-violet-50 text-violet-600'
                    : 'bg-[#646cff]/10 text-[#646cff]'
                }`}
              >
                {subscription.name}
              </span>
            )}

            <InfoBadge>{item.duration_minutes} мин.</InfoBadge>

            <InfoBadge>{item.max_places} мест</InfoBadge>
          </div>

          {subscription && (
            <p className="mt-3 text-xs text-slate-400">
              {isIndividual
                ? 'Индивидуальное направление'
                : `Стоимость по тарифу: ${formatPrice(subscription.base_price_per_lesson)} / занятие`}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#646cff]/10 px-3 text-xs font-semibold text-[#646cff] transition hover:bg-[#646cff]/15"
            >
              <Pencil className="h-3.5 w-3.5" />
              Редактировать
            </button>

            <button
              onClick={onToggle}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                item.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {item.is_active ? (
                <ToggleRight className="h-3.5 w-3.5" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}

              {item.is_active ? 'Выключить' : 'Включить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
}