import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  Clock3,
  DollarSign,
  GraduationCap,
  Loader2,
  Save,
  Wallet,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User as AdminUser } from '../pages/UsersPage';

interface TeacherUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

interface TeacherProfile {
  id: string;
  teacher_id: string;
  balance: number;
  payout_day_1: number | null;
  payout_day_2: number | null;
  created_at: string;
}

interface ActivityType {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  level_value: number | null;
  duration_minutes: number;
  max_places: number;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

interface IndividualActivity {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  price_per_lesson: number;
  teacher_payout_per_lesson: number;
  duration_minutes: number;
  is_active: boolean;
  activity_type?: ActivityType;
}

interface TeacherPayout {
  id: string;
  teacher_id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface Schedule {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  current_participants: number;
  status: string;
  activity_type?: ActivityType;
}

type Tab = 'profile' | 'activities' | 'payouts' | 'schedule';

export default function TeacherUserModal({ user, onClose, onUpdated }: TeacherUserModalProps) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('profile');
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name ?? '');
  const [phone, setPhone] = useState(user.phone);
  const [balance, setBalance] = useState('');
  const [payoutDay1, setPayoutDay1] = useState('');
  const [payoutDay2, setPayoutDay2] = useState('');

  useEffect(() => {
    setFirstName(user.first_name);
    setLastName(user.last_name ?? '');
    setPhone(user.phone);
  }, [user]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-teacher-profile', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return data as TeacherProfile | null;
    },
  });

  useEffect(() => {
    if (profile) {
      setBalance(String(profile.balance ?? 0));
      setPayoutDay1(profile.payout_day_1 ? String(profile.payout_day_1) : '');
      setPayoutDay2(profile.payout_day_2 ? String(profile.payout_day_2) : '');
    }
  }, [profile]);

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['admin-teacher-activities', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_types')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as ActivityType[];
    },
  });

  const { data: individualActivities = [] } = useQuery({
    queryKey: ['admin-teacher-individual-activities', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_activities')
        .select('*, activity_type:activity_types(*)')
        .eq('teacher_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;

      return (data ?? []) as IndividualActivity[];
    },
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin-teacher-payouts', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_payouts')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as TeacherPayout[];
    },
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['admin-teacher-schedules', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_schedules')
        .select('*, activity_type:activity_types(*)')
        .eq('teacher_id', user.id)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(100);

      if (error) throw error;

      return (data ?? []) as Schedule[];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data as AdminUser;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onUpdated(updatedUser);
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        teacher_id: user.id,
        balance: Number(balance) || 0,
        payout_day_1: payoutDay1 ? Number(payoutDay1) : null,
        payout_day_2: payoutDay2 ? Number(payoutDay2) : null,
      };

      if (profile) {
        const { error } = await supabase
          .from('teacher_profiles')
          .update(payload)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teacher_profiles')
          .insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teacher-profile', user.id] });
    },
  });

  const activeActivities = useMemo(
    () => activities.filter((activity) => activity.is_active),
    [activities],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#646cff]/10 text-[#646cff]">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{user.first_name} {user.last_name ?? ''}</h2>
                <span className="rounded-full bg-[#646cff]/10 px-2 py-1 text-[10px] font-semibold text-[#646cff]">ПРЕПОДАВАТЕЛЬ</span>
              </div>
              <p className="text-sm text-slate-500">{user.phone}</p>
            </div>
          </div>

          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-slate-100 px-6">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={<Wallet className="h-4 w-4" />}>
            Профиль
          </TabButton>

          <TabButton active={tab === 'activities'} onClick={() => setTab('activities')} icon={<GraduationCap className="h-4 w-4" />}>
            Направления
          </TabButton>

          <TabButton active={tab === 'payouts'} onClick={() => setTab('payouts')} icon={<DollarSignIcon />}>
            Выплаты
          </TabButton>

          <TabButton active={tab === 'schedule'} onClick={() => setTab('schedule')} icon={<CalendarDays className="h-4 w-4" />}>
            Расписание
          </TabButton>
        </div>

        <div className="overflow-y-auto p-6">
          {tab === 'profile' && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-4 font-semibold text-slate-900">Данные преподавателя</h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Имя" value={firstName} onChange={setFirstName} />
                  <Input label="Фамилия" value={lastName} onChange={setLastName} />
                  <Input label="Телефон" value={phone} onChange={setPhone} />
                </div>

                <button onClick={() => updateUserMutation.mutate()} disabled={updateUserMutation.isPending} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:opacity-50">
                  {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Сохранить данные
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#646cff]" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Финансы</h3>
                    <p className="text-sm text-slate-500">Баланс и даты выплат преподавателю</p>
                  </div>
                </div>

                {profileLoading ? (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <>
                    <div className="mb-5 rounded-2xl bg-[#646cff]/5 p-5">
                      <p className="text-xs font-medium text-slate-500">Текущий баланс</p>
                      <p className="mt-1 text-3xl font-bold text-[#646cff]">{Number(profile?.balance ?? 0).toLocaleString('ru-RU')} ₽</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Баланс" value={balance} onChange={setBalance} type="number" />
                      <Input label="День первой выплаты" value={payoutDay1} onChange={setPayoutDay1} type="number" />
                      <Input label="День второй выплаты" value={payoutDay2} onChange={setPayoutDay2} type="number" />
                    </div>

                    <button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:opacity-50">
                      {saveProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Сохранить финансовые настройки
                    </button>
                  </>
                )}
              </section>
            </div>
          )}

          {tab === 'activities' && (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Направления преподавателя</h3>
                  <p className="text-sm text-slate-500">Активных направлений: {activeActivities.length}</p>
                </div>
              </div>

              {activitiesLoading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ) : activities.length === 0 ? (
                <EmptyState title="Направлений пока нет" description="У преподавателя пока нет привязанных направлений." />
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{activity.name}</h4>
                            {activity.is_active ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">Активно</span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">Неактивно</span>
                            )}
                          </div>

                          {activity.description && <p className="mt-1 text-sm text-slate-500">{activity.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          {activity.duration_minutes} мин.
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Info title="Уровень" value={activity.level_value ? String(activity.level_value) : '—'} />
                        <Info title="Мест" value={String(activity.max_places ?? 0)} />
                        <Info title="Создано" value={new Date(activity.created_at).toLocaleDateString('ru-RU')} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {individualActivities.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-4 font-semibold text-slate-900">Индивидуальные занятия</h3>

                  <div className="space-y-3">
                    {individualActivities.map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row">
                          <div>
                            <p className="font-medium text-slate-900">{activity.activity_type?.name ?? 'Занятие'}</p>
                            <p className="mt-1 text-sm text-slate-500">{activity.duration_minutes} минут</p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="font-bold text-[#646cff]">{Number(activity.price_per_lesson).toLocaleString('ru-RU')} ₽</p>
                            <p className="text-xs text-slate-500">выплата: {Number(activity.teacher_payout_per_lesson).toLocaleString('ru-RU')} ₽</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'payouts' && (
            <div>
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">История выплат</h3>
                <p className="text-sm text-slate-500">Все начисления и выплаты преподавателю</p>
              </div>

              {payoutsLoading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ) : payouts.length === 0 ? (
                <EmptyState title="Выплат пока нет" description="История выплат появится здесь." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-4 py-3">Дата</th>
                        <th className="px-4 py-3">Сумма</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Оплачено</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-4 py-4 text-sm text-slate-600">{new Date(payout.created_at).toLocaleDateString('ru-RU')}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{Number(payout.amount).toLocaleString('ru-RU')} ₽</td>
                          <td className="px-4 py-4">
                            <PayoutStatus status={payout.status} />
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{payout.paid_at ? new Date(payout.paid_at).toLocaleDateString('ru-RU') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'schedule' && (
            <div>
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">Расписание</h3>
                <p className="text-sm text-slate-500">Ближайшие занятия преподавателя</p>
              </div>

              {schedulesLoading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ) : schedules.length === 0 ? (
                <EmptyState title="Расписание пустое" description="У преподавателя пока нет занятий." />
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <p className="font-semibold text-slate-900">{schedule.activity_type?.name ?? 'Занятие'}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{new Date(schedule.lesson_date).toLocaleDateString('ru-RU')}</span>
                            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-slate-900">{schedule.current_participants} чел.</p>
                          <p className="text-xs text-slate-500">{schedule.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${active ? 'border-[#646cff] text-[#646cff]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
      {icon}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10" />
    </label>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <GraduationCap className="mx-auto mb-3 h-8 w-8 text-slate-300" />
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function PayoutStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === 'paid' || normalized === 'completed') {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Выплачено</span>;
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">Отменено</span>;
  }

  return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">Ожидает</span>;
}

function DollarSignIcon() {
  return <DollarSign className="h-4 w-4" />;
}