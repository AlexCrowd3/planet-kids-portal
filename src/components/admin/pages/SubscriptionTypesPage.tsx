import { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Info,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SubscriptionType = {
  id: string;
  name: string;
  level_value: number;
  base_price_per_lesson: number;
  teacher_payout_per_lesson: number;
  is_active: boolean;
  is_individual: boolean;
  min_lessons: number;
  max_lessons: number;
};

type SubscriptionDraft = SubscriptionType;

const subscriptionConfig = {
  Стартовая: {
    icon: Sparkles,
    description: 'Базовый уровень доступа к занятиям',
    access: 'Только направления со стартовым уровнем',
  },
  Стандарт: {
    icon: Users,
    description: 'Расширенный доступ к основным направлениям',
    access: 'Стартовая + стандартная категория',
  },
  Премиум: {
    icon: Crown,
    description: 'Максимальный доступ к групповым направлениям',
    access: 'Стартовая + стандартная + премиум',
  },
  Индивидуальная: {
    icon: UserRound,
    description: 'Персональные занятия с преподавателем',
    access: 'Только индивидуальные направления',
  },
} as const;

export default function SubscriptionTypesPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDraft[]>([]);
  const [originalSubscriptions, setOriginalSubscriptions] = useState<
    SubscriptionType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('subscription_types')
      .select('*')
      .order('level_value', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const result = (data || []) as SubscriptionType[];

    setSubscriptions(result);
    setOriginalSubscriptions(result);
    setLoading(false);
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const updateField = (
    id: string,
    field: 'base_price_per_lesson' | 'teacher_payout_per_lesson',
    value: number,
  ) => {
    setSubscriptions((current) =>
      current.map((subscription) =>
        subscription.id === id
          ? {
              ...subscription,
              [field]: value,
            }
          : subscription,
      ),
    );

    setSuccessId(null);
  };

  const hasChanges = (subscription: SubscriptionDraft) => {
    const original = originalSubscriptions.find(
      (item) => item.id === subscription.id,
    );

    if (!original) {
      return false;
    }

    return (
      original.base_price_per_lesson !==
        subscription.base_price_per_lesson ||
      original.teacher_payout_per_lesson !==
        subscription.teacher_payout_per_lesson
    );
  };

  const handleSave = async (subscription: SubscriptionDraft) => {
    if (subscription.base_price_per_lesson < 0) {
      setError('Цена занятия не может быть отрицательной');
      return;
    }

    if (subscription.teacher_payout_per_lesson < 0) {
      setError('Выплата преподавателю не может быть отрицательной');
      return;
    }

    setSavingId(subscription.id);
    setError(null);
    setSuccessId(null);

    const { error: updateError } = await supabase
      .from('subscription_types')
      .update({
        base_price_per_lesson: subscription.base_price_per_lesson,
        teacher_payout_per_lesson:
          subscription.teacher_payout_per_lesson,
      })
      .eq('id', subscription.id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    setOriginalSubscriptions((current) =>
      current.map((item) =>
        item.id === subscription.id
          ? { ...item, ...subscription }
          : item,
      ),
    );

    setSuccessId(subscription.id);
    setSavingId(null);

    setTimeout(() => {
      setSuccessId(null);
    }, 2000);
  };

  const getConfig = (name: string) => {
    return (
      subscriptionConfig[name as keyof typeof subscriptionConfig] ??
      subscriptionConfig.Стартовая
    );
  };

  return (
    <div className="min-h-full bg-white p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Типы подписок
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Настройка тарифов, стоимости занятий и выплат преподавателям
            </p>
          </div>

          <button
            onClick={loadSubscriptions}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-[#646cff]/30 hover:text-[#646cff] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Обновить
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-[#646cff]/10 bg-[#646cff]/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#646cff] shadow-sm">
              <Info className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Как работает система подписок
              </p>

              <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
                Подписка оформляется на один месяц. Цена занятия хранится
                непосредственно в подписке, а направление определяет только
                минимальный уровень доступа, преподавателя, длительность и
                количество мест.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[390px] animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#646cff]/5 text-[#646cff]">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Типов подписок пока нет
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Создай четыре типа подписок через SQL
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {subscriptions.map((subscription) => {
              const config = getConfig(subscription.name);
              const Icon = config.icon;
              const changed = hasChanges(subscription);
              const saving = savingId === subscription.id;
              const success = successId === subscription.id;

              return (
                <div
                  key={subscription.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-[#646cff]/20 hover:shadow-md"
                >
                  <div className="border-b border-slate-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#646cff]/10 text-[#646cff]">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">
                              {subscription.name}
                            </h2>

                            {subscription.is_active && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                                Активна
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Доступ
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {config.access}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <PriceInput
                        label="Цена за занятие"
                        value={subscription.base_price_per_lesson}
                        onChange={(value) =>
                          updateField(
                            subscription.id,
                            'base_price_per_lesson',
                            value,
                          )
                        }
                      />

                      <PriceInput
                        label="Выплата преподавателю"
                        value={subscription.teacher_payout_per_lesson}
                        onChange={(value) =>
                          updateField(
                            subscription.id,
                            'teacher_payout_per_lesson',
                            value,
                          )
                        }
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                      <InfoCell
                        label="Занятий"
                        value={
                          subscription.min_lessons ===
                          subscription.max_lessons
                            ? `${subscription.min_lessons}`
                            : `${subscription.min_lessons}–${subscription.max_lessons}`
                        }
                      />

                      <InfoCell label="Срок" value="1 месяц" />

                      <InfoCell
                        label="Тип"
                        value={
                          subscription.is_individual
                            ? 'Индивидуальная'
                            : 'Групповая'
                        }
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div>
                        {changed ? (
                          <p className="text-xs font-medium text-amber-600">
                            Есть несохранённые изменения
                          </p>
                        ) : success ? (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                            Изменения сохранены
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Изменять можно только стоимость
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSave(subscription)}
                        disabled={!changed || saving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 text-xs font-semibold text-white transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Сохранение
                          </>
                        ) : success ? (
                          <>
                            <Check className="h-4 w-4" />
                            Сохранено
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Сохранить
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-400">
              <Info className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700">
                Остальные параметры фиксированы
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Название, уровень доступа, тип подписки, срок действия и
                количество занятий задаются в базе данных. В интерфейсе
                администратора изменяется только цена занятия и сумма выплаты
                преподавателю.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(event) => {
            const nextValue = Number(event.target.value);

            onChange(Number.isNaN(nextValue) ? 0 : nextValue);
          }}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
          ₽
        </span>
      </div>
    </label>
  );
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}