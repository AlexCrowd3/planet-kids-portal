import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  HelpCircle,
  CreditCard,
  Clock,
  ArrowRightLeft,
  MessageCircle,
} from "lucide-react";

interface SubscribePageProps {
  onBack: () => void;
}

interface SubscriptionType {
  id: string;
  name: string;
  level_value: number;
  is_individual: boolean;
  min_lessons: number;
  max_lessons: number;
  base_price_per_lesson: number;
}

interface Subscription {
  id: string;
  user_id: string;
  subscription_type_id: string;
  lessons_total: number;
  lessons_left: number;
  price_per_lesson: number;
  teacher_payout_per_lesson: number;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  subscription_types: SubscriptionType | null;
}

type SubView = "info" | "configure";

const formatDate = (date: string | null) => {
  if (!date) return "без ограничения";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getPlanBenefits = (plan: SubscriptionType) => {
  const benefits: string[] = [];

  benefits.push(`${plan.min_lessons}-${plan.max_lessons} занятий`);

  if (plan.level_value <= 1) {
    benefits.push("3 базовых направления");
    benefits.push("Ежемесячный бонус +5 баллов");
  } else if (plan.level_value === 2) {
    benefits.push("Большая часть направлений");
    benefits.push("Ежемесячный бонус +15 баллов");
  } else {
    benefits.push("Доступны все направления");
    benefits.push("Ежемесячный бонус +30 баллов");
  }

  if (plan.is_individual) {
    benefits.push("Индивидуальные занятия");
  }

  return benefits;
};

/**
 * Расчёт цены одного занятия.
 *
 * БАЗОВАЯ цена всегда берётся из subscription_types.base_price_per_lesson.
 *
 * Чем больше занятий выбрано, тем больше скидка.
 * Пользователь эту цену отдельно не видит —
 * она используется только для расчёта итоговой суммы.
 */
const getDiscountPercent = (
  lessonsCount: number,
  minLessons: number,
  maxLessons: number
) => {
  if (maxLessons <= minLessons) {
    return 0;
  }

  const progress =
    (lessonsCount - minLessons) / (maxLessons - minLessons);

  const discount = progress * 15;

  return Math.min(Math.max(discount, 0), 15);
};

const getCalculatedPrice = (
  basePrice: number,
  lessonsCount: number,
  minLessons: number,
  maxLessons: number
) => {
  const discountPercent = getDiscountPercent(
    lessonsCount,
    minLessons,
    maxLessons
  );

  const price = basePrice * (1 - discountPercent / 100);

  return Math.round(price / 5) * 5;
};

const SubscribePage = ({ onBack }: SubscribePageProps) => {
  const { user, refreshUser } = useAuth();

  const [view, setView] = useState<SubView>("configure");

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [plans, setPlans] = useState<SubscriptionType[]>([]);

  const [selectedPlanId, setSelectedPlanId] =
    useState<string>("");

  const [lessonsCount, setLessonsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  const activeSubscription = useMemo(() => {
    if (!subscription) {
      return null;
    }

    const isActuallyActive =
      subscription.is_active &&
      (!subscription.end_date ||
        new Date(subscription.end_date) >= new Date());

    return isActuallyActive ? subscription : null;
  }, [subscription]);

  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  /**
   * Итоговая стоимость.
   *
   * ВАЖНО:
   * base_price_per_lesson берётся непосредственно
   * из subscription_types в БД.
   */
  const totalPrice = useMemo(() => {
    if (!selectedPlan) {
      return 0;
    }

    if (lessonsCount <= 0) {
      return 0;
    }

    const calculatedPrice = getCalculatedPrice(
      selectedPlan.base_price_per_lesson,
      lessonsCount,
      selectedPlan.min_lessons,
      selectedPlan.max_lessons
    );

    return calculatedPrice * lessonsCount;
  }, [selectedPlan, lessonsCount]);

  const loadSubscriptionData = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [subscriptionResult, plansResult] =
        await Promise.all([
          supabase
            .from("user_subscriptions")
            .select(`
              id,
              user_id,
              subscription_type_id,
              lessons_total,
              lessons_left,
              price_per_lesson,
              teacher_payout_per_lesson,
              end_date,
              is_active,
              created_at,
              subscription_types (
                id,
                name,
                level_value,
                is_individual,
                min_lessons,
                max_lessons,
                base_price_per_lesson
              )
            `)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("end_date", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("subscription_types")
            .select(`
              id,
              name,
              level_value,
              is_individual,
              min_lessons,
              max_lessons,
              base_price_per_lesson
            `)
            .order("level_value", {
              ascending: true,
            }),
        ]);

      if (subscriptionResult.error) {
        throw subscriptionResult.error;
      }

      if (plansResult.error) {
        throw plansResult.error;
      }

      const loadedSubscription =
        subscriptionResult.data as Subscription | null;

      const loadedPlans =
        (plansResult.data ?? []) as SubscriptionType[];

      setSubscription(loadedSubscription);
      setPlans(loadedPlans);

      const hasActiveSubscription =
        loadedSubscription &&
        loadedSubscription.is_active &&
        (!loadedSubscription.end_date ||
          new Date(loadedSubscription.end_date) >=
            new Date());

      if (hasActiveSubscription) {
        setView("info");
      } else {
        setView("configure");
      }

      if (loadedPlans.length > 0) {
        const defaultPlanId =
          loadedSubscription?.subscription_type_id &&
          loadedPlans.some(
            (plan) =>
              plan.id ===
              loadedSubscription.subscription_type_id
          )
            ? loadedSubscription.subscription_type_id
            : loadedPlans[loadedPlans.length - 1].id;

        setSelectedPlanId(defaultPlanId);

        const defaultPlan =
          loadedPlans.find(
            (plan) => plan.id === defaultPlanId
          ) ?? loadedPlans[loadedPlans.length - 1];

        if (
          loadedSubscription &&
          loadedSubscription.subscription_type_id ===
            defaultPlanId
        ) {
          const existingLessons =
            loadedSubscription.lessons_total;

          setLessonsCount(
            Math.min(
              Math.max(
                existingLessons,
                defaultPlan.min_lessons
              ),
              defaultPlan.max_lessons
            )
          );
        } else {
          setLessonsCount(defaultPlan.min_lessons);
        }
      }

      await refreshUser();
    } catch (err) {
      console.error(
        "Ошибка загрузки данных подписки:",
        err
      );

      setError(
        "Не удалось загрузить данные подписки."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [user?.id]);

  const switchPlan = (planId: string) => {
    const nextPlan = plans.find(
      (plan) => plan.id === planId
    );

    if (!nextPlan) {
      return;
    }

    setSelectedPlanId(planId);
    setLessonsCount(nextPlan.min_lessons);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) {
      return;
    }

    setShowPaymentInfo(true);
  };

  const handleChangeSubscription = () => {
    if (!plans.length) {
      return;
    }

    setView("configure");

    if (activeSubscription?.subscription_type_id) {
      const currentPlan = plans.find(
        (plan) =>
          plan.id ===
          activeSubscription.subscription_type_id
      );

      if (currentPlan) {
        setSelectedPlanId(currentPlan.id);

        setLessonsCount(
          Math.min(
            Math.max(
              activeSubscription.lessons_total,
              currentPlan.min_lessons
            ),
            currentPlan.max_lessons
          )
        );
      }
    }
  };

  const handleBack = () => {
    if (view === "configure" && activeSubscription) {
      setView("info");
      return;
    }

    onBack();
  };

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-primary-opacity">
          Не удалось определить пользователя.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="text-2xl font-bold text-primary-opacity">
            Подписка
          </h1>
        </div>

        <div className="space-y-4">
          <div className="h-28 rounded-2xl glass-card animate-pulse" />
          <div className="h-48 rounded-2xl glass-card animate-pulse" />
          <div className="h-32 rounded-2xl glass-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="text-2xl font-bold text-primary-opacity">
            Подписка
          </h1>
        </div>

        <div className="glass-card p-6 text-center">
          <Info className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />

          <p className="font-semibold text-primary-opacity mb-2">
            Не удалось загрузить подписку
          </p>

          <p className="text-sm text-secondary-opacity mb-5">
            {error}
          </p>

          <button
            onClick={loadSubscriptionData}
            className="gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (view === "info" && activeSubscription) {
    const activePlan =
      activeSubscription.subscription_types;

    const benefits = activePlan
      ? getPlanBenefits(activePlan)
      : [
          `${activeSubscription.lessons_total} занятий`,
          "Активная подписка",
        ];

    const remainingClasses = Math.max(
      activeSubscription.lessons_left,
      0
    );

    return (
      <div className="animate-fade-in p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="text-2xl font-bold text-primary-opacity">
            Подписка
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="glass-premium px-5 py-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5" />

                  <span className="font-bold">
                    {activePlan?.name ??
                      "Активная подписка"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Clock className="w-3.5 h-3.5" />

                  <span>
                    Активна до{" "}
                    {formatDate(
                      activeSubscription.end_date
                    )}
                  </span>
                </div>
              </div>

              <div className="gradient-orange rounded-2xl px-5 py-4 flex-1 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/80">
                    Ваши бонусы
                  </p>

                  <HelpCircle className="w-4 h-4 text-white/60" />
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <span className="text-3xl font-bold">
                    {user.points}
                  </span>

                  <span className="text-sm">
                    баллов
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-secondary-opacity text-sm">
                  Осталось занятий
                </p>

                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-4xl font-bold text-primary-opacity">
                    {remainingClasses}
                  </span>

                  <p className="text-xs text-secondary-opacity mt-1">
                    из{" "}
                    {activeSubscription.lessons_total}{" "}
                    оплаченных
                  </p>
                </div>

                <button
                  onClick={handleChangeSubscription}
                  className="gradient-orange text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold"
                >
                  Увеличить
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-opacity mb-4">
                Что входит в{" "}
                {activePlan?.name ??
                  "подписку"}
                ?
              </h2>

              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />

                    <span className="text-primary-opacity font-medium">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-primary mb-3">
                Информация о подписке
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-secondary-opacity mb-1">
                    Тариф
                  </p>

                  <p className="font-semibold text-primary-opacity">
                    {activePlan?.name ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-secondary-opacity mb-1">
                    Всего занятий
                  </p>

                  <p className="font-semibold text-primary-opacity">
                    {activeSubscription.lessons_total}
                  </p>
                </div>

                <div>
                  <p className="text-secondary-opacity mb-1">
                    Осталось занятий
                  </p>

                  <p className="font-semibold text-primary-opacity">
                    {remainingClasses}
                  </p>
                </div>

                <div>
                  <p className="text-secondary-opacity mb-1">
                    Действует до
                  </p>

                  <p className="font-semibold text-primary-opacity">
                    {formatDate(
                      activeSubscription.end_date
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-primary mb-3">
                Зачем нужны баллы?
              </h3>

              <div className="space-y-1 text-sm text-secondary-opacity">
                <p>
                  100 баллов — дополнительное занятие
                </p>

                <p>
                  250 баллов — мастер-класс в подарок
                </p>

                <p>
                  500 баллов — игрушка на выбор
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <button
              onClick={handleChangeSubscription}
              className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-5 h-5" />
              Изменить подписку
            </button>

            <div className="glass-card p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />

              <p className="text-sm text-secondary-opacity">
                Вы можете выбрать другой тариф.
                Новые условия можно согласовать со
                следующего месяца.
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-primary" />

                <p className="font-semibold text-primary-opacity">
                  Оплата подписки
                </p>
              </div>

              <p className="text-xs text-secondary-opacity">
                Подписку необходимо оплатить заранее.
                Для оформления напишите в поддержку
                или обратитесь лично по адресу
                Ясная 14к2.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={handleBack}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="text-2xl font-bold text-primary-opacity">
          {activeSubscription
            ? "Изменение подписки"
            : "Оформление подписки"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />

            <p className="text-sm text-secondary-opacity">
              Выберите тариф и количество занятий.
              Чем больше занятий вы выбираете, тем
              выгоднее становится стоимость всей
              подписки.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-primary-opacity mb-4">
              Выберите тариф
            </h2>

            {plans.length === 0 ? (
              <div className="glass-card p-5">
                <p className="text-sm text-secondary-opacity">
                  Сейчас доступных тарифов нет.
                  Обратитесь в поддержку.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const isActive =
                    selectedPlanId === plan.id;

                  const benefits =
                    getPlanBenefits(plan);

                  return (
                    <button
                      key={plan.id}
                      onClick={() =>
                        switchPlan(plan.id)
                      }
                      className={`rounded-2xl p-4 text-left transition-all ${isActive ? "glass-premium" : "glass-card"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5" />

                        <span className="font-bold">
                          {plan.name}
                        </span>
                      </div>

                      <p
                        className={`text-xs ${isActive ? "text-white/80" : "text-secondary-opacity"}`}
                      >
                        {plan.min_lessons}-
                        {plan.max_lessons} занятий
                      </p>

                      <p
                        className={`text-xs mt-3 ${isActive ? "text-white/80" : "text-secondary-opacity"}`}
                      >
                        На 1 месяц
                      </p>

                      <div className="mt-3 space-y-1">
                        {benefits.map((benefit) => (
                          <p
                            key={benefit}
                            className={`text-xs ${isActive ? "text-white/80" : "text-secondary-opacity"}`}
                          >
                            ✓ {benefit}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlan && (
            <div>
              <h2 className="text-xl font-bold text-primary-opacity mb-4">
                Что входит в тариф
              </h2>

              <div className="space-y-3">
                {getPlanBenefits(selectedPlan).map(
                  (benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />

                      <span className="text-primary-opacity font-medium">
                        {benefit}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {selectedPlan && (
            <>
              <div>
                <h3 className="font-bold text-primary-opacity mb-3">
                  Количество занятий
                </h3>

                <input
                  type="range"
                  min={selectedPlan.min_lessons}
                  max={selectedPlan.max_lessons}
                  value={lessonsCount}
                  onChange={(event) =>
                    setLessonsCount(
                      Number(event.target.value)
                    )
                  }
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(223 88% 70%) 0%, hsl(223 88% 70%) ${selectedPlan.max_lessons === selectedPlan.min_lessons ? 100 : ((lessonsCount - selectedPlan.min_lessons) / (selectedPlan.max_lessons - selectedPlan.min_lessons)) * 100}%, hsl(0 0% 90%) ${selectedPlan.max_lessons === selectedPlan.min_lessons ? 100 : ((lessonsCount - selectedPlan.min_lessons) / (selectedPlan.max_lessons - selectedPlan.min_lessons)) * 100}%, hsl(0 0% 90%) 100%)`,
                  }}
                />

                <div className="flex items-center justify-between mt-2 text-xs text-secondary-opacity">
                  <span>
                    {selectedPlan.min_lessons}
                  </span>

                  <span>
                    {selectedPlan.max_lessons}
                  </span>
                </div>

                <p className="text-center text-3xl font-bold text-primary-opacity mt-3">
                  {lessonsCount}
                </p>

                <p className="text-center text-xs text-secondary-opacity">
                  занятий в месяц
                </p>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-secondary-opacity text-sm">
                      Вы экономите
                    </p>

                    <p className="text-lg font-bold text-primary">
                      {(() => {
                        const baseTotal =
                          selectedPlan.base_price_per_lesson *
                          lessonsCount;

                        const savings =
                          baseTotal - totalPrice;

                        return savings > 0
                          ? `${savings.toLocaleString("ru-RU")} ₽`
                          : "—";
                      })()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-secondary-opacity text-sm">
                      Занятий
                    </p>

                    <p className="text-lg font-bold text-primary-opacity">
                      {lessonsCount}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-secondary-opacity text-sm">
                  Итоговая стоимость
                </p>

                <p className="text-4xl font-bold text-primary-opacity">
                  {totalPrice.toLocaleString("ru-RU")} ₽
                </p>

                <p className="text-xs text-secondary-opacity mt-1">
                  За {lessonsCount}{" "}
                  {lessonsCount === 1
                    ? "занятие"
                    : lessonsCount < 5
                      ? "занятия"
                      : "занятий"}
                </p>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={
                  isSubmitting ||
                  lessonsCount <= 0
                }
                className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                Оформить
              </button>

              <p className="text-center text-xs text-secondary-opacity">
                Подписку необходимо будет оплатить
                заранее. Сделать это можно через
                поддержку или лично по адресу
                Ясная 14к2.
              </p>
            </>
          )}
        </div>
      </div>

      {showPaymentInfo && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl shadow-elevated animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-primary-opacity">
                  Оформление подписки
                </h2>

                <p className="text-sm text-secondary-opacity mt-1">
                  {selectedPlan.name} ·{" "}
                  {lessonsCount} занятий
                </p>
              </div>

              <button
                onClick={() =>
                  setShowPaymentInfo(false)
                }
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>

            <div className="glass-card p-4 mb-5">
              <div className="flex justify-between gap-4 mb-2">
                <span className="text-secondary-opacity">
                  Тариф
                </span>

                <span className="font-semibold text-primary-opacity">
                  {selectedPlan.name}
                </span>
              </div>

              <div className="flex justify-between gap-4 mb-2">
                <span className="text-secondary-opacity">
                  Занятий
                </span>

                <span className="font-semibold text-primary-opacity">
                  {lessonsCount}
                </span>
              </div>

              <div className="flex justify-between gap-4 pt-3 border-t border-border">
                <span className="font-semibold text-primary-opacity">
                  К оплате
                </span>

                <span className="font-bold text-primary-opacity">
                  {totalPrice.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-5">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />

              <p className="text-sm text-secondary-opacity">
                После согласования и оплаты
                администратор активирует подписку в
                системе. До подтверждения оплаты она
                не будет отображаться как активная.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  setShowPaymentInfo(false)
                }
                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold"
              >
                Написать в поддержку
              </button>

              <button
                onClick={() =>
                  setShowPaymentInfo(false)
                }
                className="w-full bg-secondary text-primary-opacity py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribePage;