import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Baby,
  Calendar,
  Check,
  ChevronLeft,
  Gift,
  Loader2,
  Minus,
  Plus,
  Save,
  ShieldCheck,
  User,
  WalletCards,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User as AdminUser } from '../pages/UsersPage';

interface ParentUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

interface SubscriptionType {
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
}

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type_id: string;
  lessons_total: number;
  lessons_left: number;
  price_per_lesson: number;
  teacher_payout_per_lesson: number;
  end_date: string;
  is_active: boolean;
  created_at: string;
  subscription_type?: SubscriptionType;
}

interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string;
  gender: string | null;
  created_at: string;
}

type Tab = 'profile' | 'subscriptions' | 'children';

export default function ParentUserModal({ user, onClose, onUpdated }: ParentUserModalProps) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('profile');
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name ?? '');
  const [phone, setPhone] = useState(user.phone);
  const [bonusAmount, setBonusAmount] = useState('');
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);

  useEffect(() => {
    setFirstName(user.first_name);
    setLastName(user.last_name ?? '');
    setPhone(user.phone);
  }, [user]);

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-user-subscriptions', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_type:subscription_types(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as UserSubscription[];
    },
  });

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['admin-user-children', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as Child[];
    },
  });

  const { data: subscriptionTypes = [] } = useQuery({
    queryKey: ['admin-subscription-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('*')
        .eq('is_active', true)
        .order('level_value', { ascending: true });

      if (error) throw error;

      return (data ?? []) as SubscriptionType[];
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

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: !user.is_active,
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

  const bonusMutation = useMutation({
    mutationFn: async (delta: number) => {
      const newBalance = Math.max(0, user.bonus_points + delta);

      const { data, error } = await supabase
        .from('users')
        .update({
          bonus_points: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data as AdminUser;
    },
    onSuccess: (updatedUser) => {
      setBonusAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onUpdated(updatedUser);
    },
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async (values: {
      subscriptionTypeId: string;
      lessonsTotal: number;
      pricePerLesson: number;
      endDate: string;
    }) => {
      const selectedType = subscriptionTypes.find((type) => type.id === values.subscriptionTypeId);

      if (!selectedType) {
        throw new Error('Тип подписки не найден');
      }

      const { error } = await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        subscription_type_id: values.subscriptionTypeId,
        lessons_total: values.lessonsTotal,
        lessons_left: values.lessonsTotal,
        price_per_lesson: values.pricePerLesson,
        teacher_payout_per_lesson: selectedType.teacher_payout_per_lesson,
        end_date: values.endDate,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscriptions', user.id] });
      setShowAddSubscription(false);
    },
  });

  const addChildMutation = useMutation({
    mutationFn: async (values: {
      firstName: string;
      lastName: string;
      birthDate: string;
      gender: string;
    }) => {
      const { error } = await supabase.from('children').insert({
        parent_id: user.id,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim() || null,
        birth_date: values.birthDate,
        gender: values.gender || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-children', user.id] });
      setShowAddChild(false);
    },
  });

  const handleBonus = (direction: 'add' | 'remove') => {
    const amount = Number(bonusAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    bonusMutation.mutate(direction === 'add' ? amount : -amount);
  };

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.is_active),
    [subscriptions],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
              {user.first_name.charAt(0)}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.first_name} {user.last_name ?? ''}</h2>
              <p className="text-sm text-slate-500">{user.phone}</p>
            </div>
          </div>

          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={<User className="h-4 w-4" />}>
            Профиль
          </TabButton>

          <TabButton active={tab === 'subscriptions'} onClick={() => setTab('subscriptions')} icon={<WalletCards className="h-4 w-4" />}>
            Подписки
            {activeSubscriptions.length > 0 && <span className="ml-1.5 rounded-full bg-[#646cff]/10 px-1.5 py-0.5 text-[10px] text-[#646cff]">{activeSubscriptions.length}</span>}
          </TabButton>

          <TabButton active={tab === 'children'} onClick={() => setTab('children')} icon={<Baby className="h-4 w-4" />}>
            Дети
            {children.length > 0 && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{children.length}</span>}
          </TabButton>
        </div>

        <div className="overflow-y-auto p-6">
          {tab === 'profile' && (
            <div className="space-y-6">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#646cff]" />
                  <h3 className="font-semibold text-slate-900">Основная информация</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Имя" value={firstName} onChange={setFirstName} />
                  <Input label="Фамилия" value={lastName} onChange={setLastName} />
                  <Input label="Телефон" value={phone} onChange={setPhone} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button onClick={() => updateUserMutation.mutate()} disabled={updateUserMutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:opacity-50">
                    {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Сохранить
                  </button>

                  <button onClick={() => toggleActiveMutation.mutate()} disabled={toggleActiveMutation.isPending} className={`h-10 rounded-xl px-4 text-sm font-medium transition ${user.is_active ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    {toggleActiveMutation.isPending ? 'Изменение...' : user.is_active ? 'Заблокировать пользователя' : 'Активировать пользователя'}
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-[#646cff]" />
                      <h3 className="font-semibold text-slate-900">Бонусные баллы</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Текущий баланс пользователя</p>
                  </div>

                  <div className="text-3xl font-bold text-[#646cff]">{user.bonus_points}</div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input type="number" min="1" value={bonusAmount} onChange={(event) => setBonusAmount(event.target.value)} placeholder="Количество баллов" className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10" />

                  <button onClick={() => handleBonus('add')} disabled={bonusMutation.isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">
                    <Plus className="h-4 w-4" />
                    Добавить
                  </button>

                  <button onClick={() => handleBonus('remove')} disabled={bonusMutation.isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                    <Minus className="h-4 w-4" />
                    Списать
                  </button>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <InfoCard title="Телефон" value={user.is_phone_verified ? 'Подтверждён' : 'Не подтверждён'} icon={<ShieldCheck className="h-5 w-5" />} />
                <InfoCard title="Дата регистрации" value={new Date(user.created_at).toLocaleDateString('ru-RU')} icon={<Calendar className="h-5 w-5" />} />
              </section>
            </div>
          )}

          {tab === 'subscriptions' && (
            <div>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">Подписки пользователя</h3>
                  <p className="text-sm text-slate-500">Всего подписок: {subscriptions.length}</p>
                </div>

                <button onClick={() => setShowAddSubscription(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8]">
                  <Plus className="h-4 w-4" />
                  Добавить подписку
                </button>
              </div>

              {subscriptionsLoading ? (
                <LoadingBlock />
              ) : subscriptions.length === 0 ? (
                <EmptyBlock icon={<WalletCards className="h-7 w-7" />} title="Подписок пока нет" description="Добавь первую подписку этому пользователю." />
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((subscription) => (
                    <SubscriptionCard key={subscription.id} subscription={subscription} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'children' && (
            <div>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">Дети</h3>
                  <p className="text-sm text-slate-500">Дети, привязанные к аккаунту родителя</p>
                </div>

                <button onClick={() => setShowAddChild(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 text-sm font-semibold text-white transition hover:bg-[#5558e8]">
                  <Plus className="h-4 w-4" />
                  Добавить ребёнка
                </button>
              </div>

              {childrenLoading ? (
                <LoadingBlock />
              ) : children.length === 0 ? (
                <EmptyBlock icon={<Baby className="h-7 w-7" />} title="Детей пока нет" description="Добавь ребёнка к этому аккаунту." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {children.map((child) => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddSubscription && (
        <AddSubscriptionModal
          types={subscriptionTypes}
          loading={addSubscriptionMutation.isPending}
          onClose={() => setShowAddSubscription(false)}
          onSubmit={(values) => addSubscriptionMutation.mutate(values)}
        />
      )}

      {showAddChild && (
        <AddChildModal
          loading={addChildMutation.isPending}
          onClose={() => setShowAddChild(false)}
          onSubmit={(values) => addChildMutation.mutate(values)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${active ? 'border-[#646cff] text-[#646cff]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
      {icon}
      {children}
    </button>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10" />
    </label>
  );
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center gap-2 text-[#646cff]">{icon}<span className="text-xs font-medium text-slate-500">{title}</span></div>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function LoadingBlock() {
  return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
}

function EmptyBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon}</div>
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SubscriptionCard({ subscription }: { subscription: UserSubscription }) {
  const percentage = subscription.lessons_total > 0 ? Math.round((subscription.lessons_left / subscription.lessons_total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">{subscription.subscription_type?.name ?? 'Подписка'}</h4>
            {subscription.is_active && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">Активна</span>}
          </div>

          <p className="mt-1 text-sm text-slate-500">До {new Date(subscription.end_date).toLocaleDateString('ru-RU')}</p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold text-[#646cff]">{subscription.lessons_left}</p>
          <p className="text-xs text-slate-500">занятий осталось</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>{subscription.lessons_total - subscription.lessons_left} использовано</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#646cff] transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">Всего занятий</p>
          <p className="mt-1 font-medium text-slate-700">{subscription.lessons_total}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Цена занятия</p>
          <p className="mt-1 font-medium text-slate-700">{Number(subscription.price_per_lesson).toLocaleString('ru-RU')} ₽</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Создана</p>
          <p className="mt-1 font-medium text-slate-700">{new Date(subscription.created_at).toLocaleDateString('ru-RU')}</p>
        </div>
      </div>
    </div>
  );
}

function ChildCard({ child }: { child: Child }) {
  const age = Math.floor((Date.now() - new Date(child.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#646cff]/10 text-[#646cff]">
          <Baby className="h-5 w-5" />
        </div>

        <div>
          <p className="font-semibold text-slate-900">{child.first_name} {child.last_name ?? ''}</p>
          <p className="text-sm text-slate-500">{age} лет</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-400">Дата рождения</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{new Date(child.birth_date).toLocaleDateString('ru-RU')}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Пол</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{child.gender === 'male' ? 'Мальчик' : child.gender === 'female' ? 'Девочка' : 'Не указан'}</p>
        </div>
      </div>
    </div>
  );
}

function AddSubscriptionModal({
  types,
  loading,
  onClose,
  onSubmit,
}: {
  types: SubscriptionType[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { subscriptionTypeId: string; lessonsTotal: number; pricePerLesson: number; endDate: string }) => void;
}) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const [lessons, setLessons] = useState('8');
  const [price, setPrice] = useState('');
  const [endDate, setEndDate] = useState('');

  const selectedType = types.find((type) => type.id === typeId);

  useEffect(() => {
    if (selectedType) {
      setPrice(String(selectedType.base_price_per_lesson));
    }
  }, [selectedType]);

  const submit = () => {
    const lessonsTotal = Number(lessons);
    const pricePerLesson = Number(price);

    if (!typeId || lessonsTotal <= 0 || pricePerLesson <= 0 || !endDate) {
      return;
    }

    onSubmit({
      subscriptionTypeId: typeId,
      lessonsTotal,
      pricePerLesson,
      endDate,
    });
  };

  return (
    <Overlay>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <ModalHeader title="Добавить подписку" onClose={onClose} />

        <div className="space-y-4">
          <SelectField label="Тип подписки" value={typeId} onChange={setTypeId}>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </SelectField>

          <Input label="Количество занятий" value={lessons} onChange={setLessons} />

          <Input label="Цена за занятие" value={price} onChange={setPrice} />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Дата окончания</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10" />
          </label>

          <button onClick={submit} disabled={loading} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Добавить подписку
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function AddChildModal({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { firstName: string; lastName: string; birthDate: string; gender: string }) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');

  const submit = () => {
    if (!firstName.trim() || !birthDate) {
      return;
    }

    onSubmit({
      firstName,
      lastName,
      birthDate,
      gender,
    });
  };

  return (
    <Overlay>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <ModalHeader title="Добавить ребёнка" onClose={onClose} />

        <div className="space-y-4">
          <Input label="Имя" value={firstName} onChange={setFirstName} />
          <Input label="Фамилия" value={lastName} onChange={setLastName} />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Дата рождения</span>
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10" />
          </label>

          <SelectField label="Пол" value={gender} onChange={setGender}>
            <option value="">Не указан</option>
            <option value="male">Мальчик</option>
            <option value="female">Девочка</option>
          </SelectField>

          <button onClick={submit} disabled={loading} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Добавить ребёнка
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10">
        {children}
      </select>
    </label>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">{children}</div>;
}