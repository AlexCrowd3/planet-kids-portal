import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import DirectionCard from "@/components/shared/DirectionCard";
import { supabase } from "@/lib/supabase";
import { Settings, X, CalendarDays, ChevronRight, TrendingUp, BookOpen, Users, Award, CreditCard, Info } from "lucide-react";
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
  subscription_types: {
    id: string;
    name: string;
    level_value: number;
    is_individual: boolean;
    min_lessons: number;
    max_lessons: number;
    base_price_per_lesson: number;
  } | null;
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
  subscription_types: {
    id: string;
    name: string;
    level_value: number;
    is_individual: boolean;
  } | null;
}

interface Booking {
  id: string;
  status: string;
  child_id: string;
  group_schedules: {
    id: string;
    start_time: string;
    day_of_week: number;
    activity_type_id: string;
    activity_types: {
      id: string;
      name: string;
    } | null;
  } | null;
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
  const digits = phone.replace(/\D/g, "");

  if (digits.length !== 11) return phone;

  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;

  return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
};

const getDayName = (day: number) => {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[day] ?? "";
};

const formatTime = (time: string) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const formatDate = (date: string | null) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const HomePage = ({ onNavigate }: HomePageProps) => {
  const { user, refreshUser } = useAuth();

  const [showBanner, setShowBanner] = useState(true);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";

    return "Добрый вечер";
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadHomeData = async () => {
      setLoading(true);

      try {
        const { data: currentUser, error: userError } = await supabase
          .from("users")
          .select("id, phone, first_name, last_name, bonus_points, is_phone_verified, is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          setDbUser(null);
          setChildren([]);
          setSubscription(null);
          setDirections([]);
          setBookings([]);
          return;
        }

        setDbUser(currentUser);

        const [childrenResult, subscriptionResult, directionsResult] = await Promise.all([
          supabase
            .from("children")
            .select("id, first_name, last_name, birth_date, gender")
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
            .order("name"),
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
        const loadedSubscription = subscriptionResult.data as Subscription | null;
        const loadedDirections = (directionsResult.data ?? []) as Direction[];

        setChildren(loadedChildren);
        setSubscription(loadedSubscription);
        setDirections(loadedDirections);

        if (loadedChildren.length > 0) {
          const childIds = loadedChildren.map((child) => child.id);

          const { data: bookingData, error: bookingsError } = await supabase
            .from("group_bookings")
            .select(`
              id,
              status,
              child_id,
              group_schedules (
                id,
                start_time,
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
            .eq("status", "confirmed")
            .order("created_at", { ascending: true })
            .limit(10);

          if (bookingsError) {
            console.error("Ошибка загрузки ближайших занятий:", bookingsError);
            setBookings([]);
          } else {
            setBookings((bookingData ?? []) as Booking[]);
          }
        } else {
          setBookings([]);
        }

        await refreshUser();
      } catch (error) {
        console.error("Ошибка загрузки главной страницы:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [user?.id]);

  const visibleDirections = directions.slice(0, 2);

  const subscriptionActive = Boolean(
    subscription &&
    subscription.is_active &&
    (!subscription.end_date || new Date(subscription.end_date) >= new Date())
  );

  const subscriptionName = subscriptionActive
    ? subscription?.subscription_types?.name ?? "Активная подписка"
    : "Без подписки";

  const remainingClasses = subscriptionActive
    ? Math.max(subscription?.lessons_left ?? 0, 0)
    : 0;

  const monthClasses = bookings.length;

  const firstName = dbUser?.first_name || user?.firstName || "Пользователь";

  const fullName = [dbUser?.first_name, dbUser?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>

          <div>
            <p className="text-secondary-opacity text-sm">{greeting},</p>
            <p className="text-primary text-lg font-bold">{firstName}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("settings")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

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
          </div>

          <div className="space-y-5">
            <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
            <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {subscriptionActive ? (
              <PremiumWidget onSubscribeClick={() => onNavigate("subscribe")} />
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
                    Оформите подписку и получите доступ к занятиям для вашего ребёнка.
                    Вы сможете выбрать подходящее направление и количество занятий.
                  </p>

                  <button
                    onClick={() => onNavigate("subscribe")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#646cff] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Оформить подписку
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="hidden grid-cols-3 gap-3 lg:grid">
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>

                <div>
                  <p className="text-primary-opacity text-2xl font-bold">
                    {remainingClasses}
                  </p>

                  <p className="text-secondary-opacity text-xs">
                    Занятий осталось
                  </p>
                </div>
              </div>

              <div className="glass-card flex items-center gap-3 p-4">
                <div className="gradient-orange flex h-10 w-10 items-center justify-center rounded-xl">
                  <Award className="h-5 w-5 text-primary-foreground" />
                </div>

                <div>
                  <p className="text-primary-opacity text-2xl font-bold">
                    {dbUser?.bonus_points ?? user?.points ?? 0}
                  </p>

                  <p className="text-secondary-opacity text-xs">
                    Баллов
                  </p>
                </div>
              </div>

              <div className="glass-card flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <TrendingUp className="h-5 w-5 text-notification-success" />
                </div>

                <div>
                  <p className="text-primary-opacity text-2xl font-bold">
                    {monthClasses}
                  </p>

                  <p className="text-secondary-opacity text-xs">
                    Занятий в списке
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                Специальные предложения
              </h2>

              {visibleDirections.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {visibleDirections.map((direction) => (
                    <DirectionCard
                      key={direction.id}
                      name={direction.name}
                      age={direction.subscription_types?.name ?? "Для всех"}
                      description={direction.description ?? "Подробнее о направлении"}
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
                    Новые направления появятся здесь автоматически.
                  </p>
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                Ближайшие занятия
              </h2>

              {bookings.length > 0 ? (
                <div className="space-y-2">
                  {bookings.slice(0, 3).map((booking) => {
                    const schedule = booking.group_schedules;
                    const activity = schedule?.activity_types;
                    const child = booking.children;

                    const childName = [child?.first_name, child?.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={booking.id}
                        className="glass-card flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
                            <CalendarDays className="h-4 w-4 text-primary-foreground" />
                          </div>

                          <div>
                            <p className="text-primary-opacity text-sm font-semibold">
                              {activity?.name ?? "Занятие"}
                            </p>

                            <p className="text-secondary-opacity text-xs">
                              {childName || "Ребёнок"}
                            </p>
                          </div>
                        </div>

                        <span className="text-primary text-sm font-medium">
                          {schedule?.day_of_week !== undefined
                            ? `${getDayName(schedule.day_of_week)}, `
                            : ""}

                          {schedule?.start_time
                            ? formatTime(schedule.start_time)
                            : "Время не указано"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-5">
                  <p className="text-primary-opacity font-medium">
                    Ближайших занятий нет
                  </p>

                  <p className="text-secondary-opacity mt-1 text-sm">
                    Запишитесь на занятие в разделе «Направления».
                  </p>
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                Ваши дети
              </h2>

              {children.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {children.map((child) => {
                    const childName = [child.first_name, child.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={child.id}
                        className="glass-card flex items-center gap-3 px-5 py-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-primary-opacity truncate font-semibold">
                            {childName || child.first_name}
                          </p>

                          <p className="text-secondary-opacity text-xs">
                            {child.birth_date
                              ? `Дата рождения: ${new Date(child.birth_date).toLocaleDateString("ru-RU")}`
                              : "Ваш ребёнок"}
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
                    Добавьте ребёнка в профиле, чтобы записываться на занятия.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {showBanner && (
              <div className="gradient-primary relative rounded-2xl p-5 text-primary-foreground animate-scale-in">
                <button
                  onClick={() => setShowBanner(false)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="mb-1 text-lg font-bold">
                  Запишись на занятие!
                </h3>

                <p className="mb-3 text-sm text-white/80">
                  Выберите подходящее направление для вашего ребёнка.
                </p>

                <button
                  onClick={() => onNavigate("directions")}
                  className="bg-background text-primary-opacity flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-all hover:shadow-soft"
                >
                  Все направления
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div>
              <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                Уведомления
              </h2>

              <div className="space-y-2">
                {notifications.slice(0, 1).map((notification, index) => (
                  <div
                    key={index}
                    className={`notification-card ${notification.color} lg:hidden`}
                  >
                    <notification.icon className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-medium">
                      {notification.text}
                    </p>
                  </div>
                ))}

                {notifications.map((notification, index) => (
                  <div
                    key={`desktop-${index}`}
                    className={`notification-card ${notification.color} hidden lg:flex`}
                  >
                    <notification.icon className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-medium">
                      {notification.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate("notifications")}
              className="text-secondary-opacity hover:text-primary w-full py-2 text-center text-sm font-medium transition-colors"
            >
              Посмотреть все
            </button>

            <div className="hidden space-y-2 lg:block">
              <h2 className="text-primary-opacity mb-3 text-lg font-bold">
                Быстрые действия
              </h2>

              <button
                onClick={() => onNavigate("calendar")}
                className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
              >
                <CalendarDays className="text-primary h-5 w-5" />

                <span className="text-primary-opacity text-sm font-medium">
                  Открыть календарь
                </span>

                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onNavigate("directions")}
                className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
              >
                <BookOpen className="text-primary h-5 w-5" />

                <span className="text-primary-opacity text-sm font-medium">
                  Все направления
                </span>

                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onNavigate("profile")}
                className="glass-card hover:shadow-elevated flex w-full items-center gap-3 px-4 py-3 transition-all"
              >
                <Users className="text-primary h-5 w-5" />

                <span className="text-primary-opacity text-sm font-medium">
                  Профиль
                </span>

                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="glass-card hidden p-4 lg:block">
              <div className="flex items-center gap-3">
                <CreditCard className="text-primary h-5 w-5" />

                <div className="min-w-0">
                  <p className="text-primary-opacity truncate text-sm font-semibold">
                    {subscriptionName}
                  </p>

                  <p className="text-secondary-opacity text-xs">
                    {subscriptionActive
                      ? subscription?.end_date
                        ? `Действует до ${formatDate(subscription.end_date)}`
                        : "Подписка активна"
                      : "Подписка не активна"}
                  </p>
                </div>

                {!subscriptionActive && (
                  <button
                    onClick={() => onNavigate("subscribe")}
                    className="ml-auto shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Оформить
                  </button>
                )}
              </div>
            </div>

            {subscriptionActive && (
              <div className="glass-card hidden p-4 lg:block">
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

                {subscription?.end_date && (
                  <p className="text-secondary-opacity mt-3 text-xs">
                    Подписка действует до {formatDate(subscription.end_date)}
                  </p>
                )}
              </div>
            )}

            {!subscriptionActive && (
              <div className="hidden rounded-2xl border border-[#646cff]/15 bg-[#646cff]/5 p-5 lg:block">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#646cff]/10">
                  <CreditCard className="h-5 w-5 text-[#646cff]" />
                </div>

                <h3 className="text-primary-opacity font-semibold">
                  Нет активной подписки
                </h3>

                <p className="text-secondary-opacity mt-1 text-sm leading-5">
                  Оформите подписку, чтобы записывать детей на занятия.
                </p>

                <button
                  onClick={() => onNavigate("subscribe")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5558e8]"
                >
                  Оформить подписку
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;