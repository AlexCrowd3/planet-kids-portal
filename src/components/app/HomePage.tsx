import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import DirectionCard from "@/components/shared/DirectionCard";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  X,
  CalendarDays,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  CreditCard,
  Info,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface HomePageProps {
  onNavigate: (view: string) => void;
}

interface DbUser {
  id: string;
  phone: string;
  first_name: string;
  last_name: string | null;
  bonus_points: number;
  is_phone_verified: boolean;
  is_active: boolean;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string;
  gender: string | null;
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

interface DirectionSubscriptionType {
  id: string;
  name: string;
  level_value: number;
  is_individual: boolean;
}

interface Direction {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  max_places: number;
  image: string | null;
  is_active: boolean;
  subscription_type_id: string | null;
  subscription_types: DirectionSubscriptionType | null;
}

interface GroupSchedule {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  activity_type_id: string;
  activity_types: {
    id: string;
    name: string;
  } | null;
}

interface Booking {
  id: string;
  schedule_id: string;
  child_id: string;
  user_id: string;
  status: string;
  lesson_date: string;
  created_at: string;
  group_schedules: GroupSchedule | null;
  children: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
}

const notifications = [
  {
    text: "Проверьте ближайшие занятия ваших детей",
    color: "orange" as const,
    icon: CalendarDays,
  },
  {
    text: "Проверьте срок действия вашей подписки",
    color: "red" as const,
    icon: CreditCard,
  },
  {
    text: "У нас есть новые направления",
    color: "blue" as const,
    icon: Info,
  },
];

const formatPhone = (phone: string) => {
  if (!phone) return "Телефон не указан";

  const digits = phone.replace(/\D/g, "");

  if (digits.length !== 11) {
    return phone;
  }

  const normalized = digits.startsWith("8")
    ? `7${digits.slice(1)}`
    : digits;

  if (!normalized.startsWith("7")) {
    return phone;
  }

  return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
};

const getDayName = (day: number) => {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return days[day] ?? "";
};

const formatTime = (time: string | null | undefined) => {
  if (!time) {
    return "Время не указано";
  }

  return time.slice(0, 5);
};

const parseDateOnly = (date: string | null | undefined) => {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatDate = (date: string | null | undefined) => {
  const parsed = parseDateOnly(date);

  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (date: string | null | undefined) => {
  const parsed = parseDateOnly(date);

  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

const isSubscriptionCurrentlyActive = (
  subscription: Subscription | null
) => {
  if (!subscription) {
    return false;
  }

  if (!subscription.is_active) {
    return false;
  }

  if (!subscription.end_date) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = parseDateOnly(subscription.end_date);

  if (!endDate) {
    return false;
  }

  return endDate >= today;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const HomePage = ({ onNavigate }: HomePageProps) => {
  const { user } = useAuth();

  const [showBanner, setShowBanner] = useState(true);

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Доброе утро";
    }

    if (hour < 18) {
      return "Добрый день";
    }

    return "Добрый вечер";
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDbUser(null);
      setChildren([]);
      setSubscription(null);
      setDirections([]);
      setBookings([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadHomeData = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        /*
         * Пользователь
         */
        const { data: currentUser, error: userError } = await supabase
          .from("users")
          .select(
            "id, phone, first_name, last_name, bonus_points, is_phone_verified, is_active"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          if (!cancelled) {
            setDbUser(null);
            setChildren([]);
            setSubscription(null);
            setDirections([]);
            setBookings([]);
          }

          return;
        }

        /*
         * Основные данные грузим параллельно.
         */
        const [
          childrenResult,
          subscriptionResult,
          directionsResult,
        ] = await Promise.all([
          supabase
            .from("children")
            .select(
              "id, first_name, last_name, birth_date, gender"
            )
            .eq("parent_id", currentUser.id)
            .order("created_at", { ascending: true }),

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
            .eq("user_id", currentUser.id)
            .eq("is_active", true)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("activity_types")
            .select(`
              id,
              name,
              description,
              duration_minutes,
              max_places,
              image,
              is_active,
              subscription_type_id,
              subscription_types (
                id,
                name,
                level_value,
                is_individual
              )
            `)
            .eq("is_active", true)
            .order("name", { ascending: true }),
        ]);

        if (childrenResult.error) {
          throw childrenResult.error;
        }

        if (subscriptionResult.error) {
          throw subscriptionResult.error;
        }

        if (directionsResult.error) {
          throw directionsResult.error;
        }

        const loadedChildren = (childrenResult.data ?? []) as Child[];

        const rawSubscription = subscriptionResult.data;

        const loadedSubscription: Subscription | null =
          rawSubscription
            ? {
                ...(rawSubscription as any),
                subscription_types: normalizeRelation(
                  (rawSubscription as any).subscription_types
                ),
              }
            : null;

        const loadedDirections: Direction[] = (
          directionsResult.data ?? []
        ).map((direction: any) => ({
          id: direction.id,
          name: direction.name,
          description: direction.description,
          duration_minutes: direction.duration_minutes,
          max_places: direction.max_places,
          image: direction.image,
          is_active: direction.is_active,
          subscription_type_id: direction.subscription_type_id,
          subscription_types: normalizeRelation(
            direction.subscription_types
          ),
        }));

        /*
         * Записи детей.
         *
         * ВАЖНО:
         * lesson_date находится в group_bookings,
         * а не в group_schedules.
         *
         * Не фильтруем status на уровне SQL,
         * потому что в БД статус может быть booked,
         * а в старом коде использовался confirmed.
         *
         * Забираем записи и фильтруем активные статусы
         * уже в JS.
         */
        let loadedBookings: Booking[] = [];

        if (loadedChildren.length > 0) {
          const childIds = loadedChildren.map(
            (child) => child.id
          );

          const { data: bookingData, error: bookingsError } =
            await supabase
              .from("group_bookings")
              .select(`
                id,
                schedule_id,
                child_id,
                user_id,
                status,
                lesson_date,
                created_at,
                group_schedules (
                  id,
                  start_time,
                  end_time,
                  day_of_week,
                  activity_type_id,
                  activity_types (
                    id,
                    name
                  )
                ),
                children (
                  id,
                  first_name,
                  last_name
                )
              `)
              .in("child_id", childIds)
              .eq("user_id", currentUser.id)
              .order("lesson_date", { ascending: true })
              .limit(100);

          if (bookingsError) {
            console.error(
              "Ошибка загрузки занятий:",
              bookingsError
            );
          } else {
            loadedBookings = (bookingData ?? [])
              .map((booking: any) => ({
                id: booking.id,
                schedule_id: booking.schedule_id,
                child_id: booking.child_id,
                user_id: booking.user_id,
                status: booking.status,
                lesson_date: booking.lesson_date,
                created_at: booking.created_at,
                group_schedules: normalizeRelation(
                  booking.group_schedules
                )
                  ? {
                      ...normalizeRelation(
                        booking.group_schedules
                      ),
                      activity_types: normalizeRelation(
                        normalizeRelation(
                          booking.group_schedules
                        )?.activity_types
                      ),
                    }
                  : null,
                children: normalizeRelation(booking.children),
              }))
              .filter((booking) => {
                /*
                 * booked — основной статус из текущей схемы.
                 * confirmed оставлен для совместимости
                 * со старыми данными.
                 */
                return (
                  booking.status === "booked" ||
                  booking.status === "confirmed"
                );
              });
          }
        }

        if (cancelled) {
          return;
        }

        setDbUser(currentUser as DbUser);
        setChildren(loadedChildren);
        setSubscription(loadedSubscription);
        setDirections(loadedDirections);
        setBookings(loadedBookings);
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.error(
          "Ошибка загрузки главной страницы:",
          error
        );

        setLoadError(
          error?.message ||
            "Не удалось загрузить данные главной страницы"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const subscriptionActive = useMemo(() => {
    return isSubscriptionCurrentlyActive(subscription);
  }, [subscription]);

  const subscriptionName = subscriptionActive
    ? subscription?.subscription_types?.name ??
      "Активная подписка"
    : "Без подписки";

  const remainingClasses = subscriptionActive
    ? Math.max(subscription?.lessons_left ?? 0, 0)
    : 0;

  /*
   * Только будущие/сегодняшние занятия.
   */
  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
      .filter((booking) => {
        const lessonDate = parseDateOnly(
          booking.lesson_date
        );

        return lessonDate !== null && lessonDate >= today;
      })
      .sort((a, b) => {
        const dateA = parseDateOnly(a.lesson_date);
        const dateB = parseDateOnly(b.lesson_date);

        if (!dateA || !dateB) {
          return 0;
        }

        const dateDifference =
          dateA.getTime() - dateB.getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        const timeA =
          a.group_schedules?.start_time ?? "99:99";

        const timeB =
          b.group_schedules?.start_time ?? "99:99";

        return timeA.localeCompare(timeB);
      });
  }, [bookings]);

  /*
   * Занятия текущего месяца.
   */
  const monthClasses = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    return bookings.filter((booking) => {
      const date = parseDateOnly(booking.lesson_date);

      if (!date) {
        return false;
      }

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    }).length;
  }, [bookings]);

  /*
   * Уникальные направления, на которые уже записаны дети.
   */
  const bookedDirectionsCount = useMemo(() => {
    const ids = new Set<string>();

    bookings.forEach((booking) => {
      const activityTypeId =
        booking.group_schedules?.activity_type_id;

      if (activityTypeId) {
        ids.add(activityTypeId);
      }
    });

    return ids.size;
  }, [bookings]);

  /*
   * Берём первые 2 направления для блока
   * "Специальные предложения".
   */
  const visibleDirections = directions.slice(0, 2);

  const firstName =
    dbUser?.first_name ||
    user?.firstName ||
    "Пользователь";

  const bonusPoints =
    dbUser?.bonus_points ??
    user?.points ??
    0;

  const fullName = [dbUser?.first_name, dbUser?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <p className="text-secondary-opacity text-sm">
                {greeting},
              </p>

              <p className="text-primary text-lg font-bold">
                {firstName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {loadError && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">
                Не удалось загрузить часть данных
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {loadError}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="h-40 animate-pulse rounded-2xl bg-secondary" />

              <div className="grid grid-cols-3 gap-3">
                <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
                <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
                <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
              </div>

              <div className="h-40 animate-pulse rounded-2xl bg-secondary" />

              <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
            </div>

            <div className="space-y-5">
              <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
              <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
              <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* LEFT */}
            <div className="space-y-5 lg:col-span-2">
              {/* Subscription */}
              {subscriptionActive ? (
                <PremiumWidget
                  onSubscribeClick={() =>
                    onNavigate("subscribe")
                  }
                />
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#646cff] to-[#7c5cff] p-6 text-white shadow-lg">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                        <CreditCard className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white/70">
                          Сейчас у вас
                        </p>

                        <p className="text-lg font-bold">
                          Нет активной подписки
                        </p>
                      </div>
                    </div>

                    <p className="mb-5 max-w-xl text-sm leading-6 text-white/80">
                      Оформите подписку и получите доступ к
                      занятиям для вашего ребёнка. Вы сможете
                      выбрать подходящее направление и количество
                      занятий.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("subscribe")
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#646cff] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Оформить подписку
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="glass-card flex items-center gap-3 p-4">
                  <div className="gradient-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-primary-opacity text-2xl font-bold">
                      {remainingClasses}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      Занятий осталось
                    </p>
                  </div>
                </div>

                <div className="glass-card flex items-center gap-3 p-4">
                  <div className="gradient-orange flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Award className="h-5 w-5 text-primary-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-primary-opacity text-2xl font-bold">
                      {bonusPoints}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      Баллов
                    </p>
                  </div>
                </div>

                <div className="glass-card flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <TrendingUp className="h-5 w-5 text-notification-success" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-primary-opacity text-2xl font-bold">
                      {monthClasses}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      Занятий в этом месяце
                    </p>
                  </div>
                </div>
              </div>

              {/* Directions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-primary-opacity text-lg font-bold">
                    Специальные предложения
                  </h2>

                  {directions.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("directions")
                      }
                      className="text-primary flex items-center gap-1 text-sm font-semibold"
                    >
                      Все
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {visibleDirections.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {visibleDirections.map((direction) => (
                      <DirectionCard
                        key={direction.id}
                        name={direction.name}
                        age={
                          direction.subscription_types?.name ??
                          "Для всех"
                        }
                        description={
                          direction.description ??
                          "Подробнее о направлении"
                        }
                        days={[]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-5">
                    <p className="text-primary-opacity font-medium">
                      Пока нет доступных направлений
                    </p>

                    <p className="text-secondary-opacity mt-1 text-sm">
                      Новые направления появятся здесь
                      автоматически.
                    </p>
                  </div>
                )}
              </div>

              {/* Upcoming lessons */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-primary-opacity text-lg font-bold">
                    Ближайшие занятия
                  </h2>

                  {upcomingBookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("calendar")
                      }
                      className="text-primary flex items-center gap-1 text-sm font-semibold"
                    >
                      Календарь
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {upcomingBookings.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingBookings
                      .slice(0, 5)
                      .map((booking) => {
                        const schedule =
                          booking.group_schedules;

                        const activity =
                          schedule?.activity_types;

                        const child =
                          booking.children;

                        const childName = [
                          child?.first_name,
                          child?.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div
                            key={booking.id}
                            className="glass-card flex items-center justify-between gap-4 px-4 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="gradient-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                <CalendarDays className="h-5 w-5 text-primary-foreground" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-primary-opacity truncate text-sm font-semibold">
                                  {activity?.name ??
                                    "Занятие"}
                                </p>

                                <p className="text-secondary-opacity truncate text-xs">
                                  {childName ||
                                    "Ребёнок"}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-primary text-sm font-semibold">
                                {formatShortDate(
                                  booking.lesson_date
                                )}
                              </p>

                              <p className="text-secondary-opacity text-xs">
                                {schedule?.start_time
                                  ? formatTime(
                                      schedule.start_time
                                    )
                                  : "Время не указано"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="glass-card p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>

                      <div>
                        <p className="text-primary-opacity font-medium">
                          Ближайших занятий нет
                        </p>

                        <p className="text-secondary-opacity mt-1 text-sm leading-5">
                          Выберите занятие в календаре,
                          чтобы записать ребёнка.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            onNavigate("calendar")
                          }
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                        >
                          Открыть календарь
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Children */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-primary-opacity text-lg font-bold">
                    Ваши дети
                  </h2>

                  {children.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("profile")
                      }
                      className="text-primary flex items-center gap-1 text-sm font-semibold"
                    >
                      Профиль
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {children.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {children.map((child) => {
                      const childName = [
                        child.first_name,
                        child.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      const childBookings =
                        bookings.filter(
                          (booking) =>
                            booking.child_id ===
                            child.id
                        );

                      return (
                        <div
                          key={child.id}
                          className="glass-card flex items-center gap-3 px-5 py-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-primary-opacity truncate font-semibold">
                              {childName ||
                                child.first_name}
                            </p>

                            <p className="text-secondary-opacity text-xs">
                              {child.birth_date
                                ? `Дата рождения: ${formatDate(
                                    child.birth_date
                                  )}`
                                : "Ваш ребёнок"}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-primary-opacity text-sm font-bold">
                              {childBookings.length}
                            </p>

                            <p className="text-secondary-opacity text-[10px]">
                              занятий
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-card p-5">
                    <p className="text-primary-opacity font-medium">
                      Дети пока не добавлены
                    </p>

                    <p className="text-secondary-opacity mt-1 text-sm">
                      Добавьте ребёнка в профиле, чтобы
                      записываться на занятия.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("profile")
                      }
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                    >
                      Перейти в профиль
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              {/* Banner */}
              {showBanner && (
                <div className="gradient-primary relative rounded-2xl p-5 text-primary-foreground animate-scale-in">
                  <button
                    type="button"
                    onClick={() =>
                      setShowBanner(false)
                    }
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="mb-1 text-lg font-bold">
                    Запишись на занятие!
                  </h3>

                  <p className="mb-3 text-sm text-white/80">
                    Выберите подходящее направление
                    для вашего ребёнка.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("directions")
                    }
                    className="bg-background text-primary-opacity flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-all hover:shadow-soft"
                  >
                    Все направления
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Notifications */}
              <div>
                <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                  Уведомления
                </h2>

                <div className="space-y-2">
                  {notifications
                    .slice(0, 1)
                    .map(
                      (notification, index) => (
                        <div
                          key={index}
                          className={`notification-card ${notification.color} lg:hidden`}
                        >
                          <notification.icon className="mt-0.5 h-5 w-5 shrink-0" />

                          <p className="text-sm font-medium">
                            {notification.text}
                          </p>
                        </div>
                      )
                    )}

                  {notifications.map(
                    (notification, index) => (
                      <div
                        key={`desktop-${index}`}
                        className={`notification-card ${notification.color} hidden lg:flex`}
                      >
                        <notification.icon className="mt-0.5 h-5 w-5 shrink-0" />

                        <p className="text-sm font-medium">
                          {notification.text}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate("notifications")
                }
                className="text-secondary-opacity hover:text-primary w-full py-2 text-center text-sm font-medium transition-colors"
              >
                Посмотреть все
              </button>

              {/* Quick actions */}
              <div className="space-y-2 lg:block">
                <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                  Быстрые действия
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate("calendar")
                  }
                  className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
                >
                  <CalendarDays className="text-primary h-5 w-5" />

                  <span className="text-primary-opacity text-sm font-medium">
                    Открыть календарь
                  </span>

                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate("directions")
                  }
                  className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
                >
                  <BookOpen className="text-primary h-5 w-5" />

                  <span className="text-primary-opacity text-sm font-medium">
                    Все направления
                  </span>

                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate("profile")
                  }
                  className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
                >
                  <Users className="text-primary h-5 w-5" />

                  <span className="text-primary-opacity text-sm font-medium">
                    Профиль
                  </span>

                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Subscription */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-primary h-5 w-5 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="text-primary-opacity truncate text-sm font-semibold">
                      {subscriptionName}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      {subscriptionActive
                        ? subscription?.end_date
                          ? `Действует до ${formatDate(
                              subscription.end_date
                            )}`
                          : "Подписка активна"
                        : "Подписка не активна"}
                    </p>
                  </div>

                  {!subscriptionActive && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("subscribe")
                      }
                      className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Оформить
                    </button>
                  )}
                </div>
              </div>

              {/* Remaining lessons */}
              {subscriptionActive && (
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-secondary-opacity text-xs">
                        Осталось занятий
                      </p>

                      <p className="text-primary-opacity mt-1 text-2xl font-bold">
                        {remainingClasses}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <BookOpen className="text-primary h-5 w-5" />
                    </div>
                  </div>

                  {subscription?.lessons_total ? (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-secondary-opacity">
                          Использовано
                        </span>

                        <span className="text-secondary-opacity">
                          {Math.max(
                            subscription.lessons_total -
                              subscription.lessons_left,
                            0
                          )}{" "}
                          / {subscription.lessons_total}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                ((subscription.lessons_total -
                                  subscription.lessons_left) /
                                  subscription.lessons_total) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {subscription?.end_date && (
                    <p className="text-secondary-opacity mt-3 text-xs">
                      Подписка действует до{" "}
                      {formatDate(
                        subscription.end_date
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* No subscription */}
              {!subscriptionActive && (
                <div className="rounded-2xl border border-[#646cff]/15 bg-[#646cff]/5 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#646cff]/10">
                    <CreditCard className="h-5 w-5 text-[#646cff]" />
                  </div>

                  <h3 className="text-primary-opacity font-semibold">
                    Нет активной подписки
                  </h3>

                  <p className="text-secondary-opacity mt-1 text-sm leading-5">
                    Оформите подписку, чтобы записывать
                    детей на занятия.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("subscribe")
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5558e8]"
                  >
                    Оформить подписку
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Profile info */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-primary-opacity truncate text-sm font-semibold">
                      {fullName || firstName}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      {formatPhone(
                        dbUser?.phone ??
                          user?.phone ??
                          ""
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-primary-opacity text-lg font-bold">
                      {children.length}
                    </p>

                    <p className="text-secondary-opacity text-[11px]">
                      Детей
                    </p>
                  </div>

                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-primary-opacity text-lg font-bold">
                      {bookedDirectionsCount}
                    </p>

                    <p className="text-secondary-opacity text-[11px]">
                      Направлений
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;