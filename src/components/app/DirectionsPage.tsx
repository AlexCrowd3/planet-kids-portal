import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface DirectionsPageProps {
  onNavigate?: (page: string) => void;
}

interface SubscriptionType {
  id: string;
  name: string;
  level_value: number;
  base_price_per_lesson: number;
  teacher_payout_per_lesson: number;
  is_active: boolean;
  min_lessons: number;
  max_lessons: number;
  max_price_per_lesson: number;
  is_individual: boolean;
}

interface ActivityType {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  duration_minutes: number;
  max_places: number | null;
  image: string | null;
  is_active: boolean;
  subscription_type_id: string | null;
  subscriptionType: SubscriptionType | null;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface GroupSchedule {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  current_participants: number;
  status: string;
  teacher: Teacher | null;
}

interface UserChild {
  id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string;
  gender: string | null;
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
  subscriptionType: SubscriptionType | null;
}

interface Direction {
  id: string;
  name: string;
  description: string;
  image: string | null;
  durationMinutes: number;
  maxPlaces: number;
  teacher: Teacher | null;
  subscriptionType: SubscriptionType | null;
  schedules: GroupSchedule[];
}

interface Booking {
  id: string;
  schedule_id: string;
  child_id: string;
  user_id: string;
  subscription_id: string;
  status: string;
}

interface SelectedDirection extends Direction {}

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
};

const formatDateWithWeekday = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const formatTime = (time: string) => {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
};

const getTeacherName = (teacher: Teacher | null) => {
  if (!teacher) {
    return "Преподаватель не указан";
  }

  return [teacher.first_name, teacher.last_name].filter(Boolean).join(" ");
};

const getImageUrl = (image: string | null) => {
  if (!image) {
    return null;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return image;
};

const getAvailablePlaces = (schedule: GroupSchedule, direction: Direction) => {
  const maxPlaces = schedule.current_participants !== undefined
    ? direction.maxPlaces
    : direction.maxPlaces;

  return Math.max(0, maxPlaces - (schedule.current_participants ?? 0));
};

const isSubscriptionActive = (subscription: UserSubscription | null) => {
  if (!subscription) {
    return false;
  }

  if (!subscription.is_active) {
    return false;
  }

  if (subscription.lessons_left <= 0) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(`${subscription.end_date}T00:00:00`);

  return endDate >= today;
};

export default function DirectionsPage({ onNavigate }: DirectionsPageProps) {
  const { user } = useAuth();

  const [directions, setDirections] = useState<Direction[]>([]);
  const [children, setChildren] = useState<UserChild[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  const [selectedDirection, setSelectedDirection] = useState<SelectedDirection | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<GroupSchedule | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [activeCategory, setActiveCategory] = useState("Все");
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setDirections([]);
      setChildren([]);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          activityTypesResult,
          schedulesResult,
          childrenResult,
          subscriptionResult,
        ] = await Promise.all([
          supabase
            .from("activity_types")
            .select(`
              id,
              name,
              description,
              teacher_id,
              duration_minutes,
              max_places,
              image,
              is_active,
              subscription_type_id,
              subscription_types (
                id,
                name,
                level_value,
                base_price_per_lesson,
                teacher_payout_per_lesson,
                is_active,
                min_lessons,
                max_lessons,
                max_price_per_lesson,
                is_individual
              )
            `)
            .eq("is_active", true)
            .eq("subscription_types.is_individual", false)
            .order("created_at", { ascending: true }),

          supabase
            .from("group_schedules")
            .select(`
              id,
              activity_type_id,
              teacher_id,
              lesson_date,
              start_time,
              end_time,
              current_participants,
              status
            `)
            .eq("status", "scheduled")
            .gte("lesson_date", new Date().toISOString().split("T")[0])
            .order("lesson_date", { ascending: true })
            .order("start_time", { ascending: true }),

          supabase
            .from("children")
            .select("id, first_name, last_name, birth_date, gender")
            .eq("parent_id", user.id)
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
                base_price_per_lesson,
                teacher_payout_per_lesson,
                is_active,
                min_lessons,
                max_lessons,
                max_price_per_lesson,
                is_individual
              )
            `)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (activityTypesResult.error) {
          throw activityTypesResult.error;
        }

        if (schedulesResult.error) {
          throw schedulesResult.error;
        }

        if (childrenResult.error) {
          throw childrenResult.error;
        }

        if (subscriptionResult.error) {
          throw subscriptionResult.error;
        }

        const activityTypes = (activityTypesResult.data ?? []) as any[];
        const schedules = (schedulesResult.data ?? []) as any[];
        const loadedChildren = (childrenResult.data ?? []) as UserChild[];

        const loadedSubscription = subscriptionResult.data as any;

        setChildren(loadedChildren);

        if (loadedSubscription) {
          const subscriptionType = Array.isArray(loadedSubscription.subscription_types)
            ? loadedSubscription.subscription_types[0] ?? null
            : loadedSubscription.subscription_types ?? null;

          setSubscription({
            id: loadedSubscription.id,
            user_id: loadedSubscription.user_id,
            subscription_type_id: loadedSubscription.subscription_type_id,
            lessons_total: loadedSubscription.lessons_total,
            lessons_left: loadedSubscription.lessons_left,
            price_per_lesson: Number(loadedSubscription.price_per_lesson ?? 0),
            teacher_payout_per_lesson: Number(loadedSubscription.teacher_payout_per_lesson ?? 0),
            end_date: loadedSubscription.end_date,
            is_active: loadedSubscription.is_active,
            created_at: loadedSubscription.created_at,
            subscriptionType,
          });
        } else {
          setSubscription(null);
        }

        const teacherIds = [
          ...new Set(
            schedules
              .map((schedule) => schedule.teacher_id)
              .filter(Boolean)
          ),
        ];

        let teachers: Teacher[] = [];

        if (teacherIds.length > 0) {
          const { data: teachersData, error: teachersError } = await supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", teacherIds);

          if (teachersError) {
            throw teachersError;
          }

          teachers = (teachersData ?? []) as Teacher[];
        }

        const teacherMap = new Map<string, Teacher>();

        teachers.forEach((teacher) => {
          teacherMap.set(teacher.id, teacher);
        });

        const mappedSchedules: GroupSchedule[] = schedules.map((schedule) => ({
          id: schedule.id,
          activity_type_id: schedule.activity_type_id,
          teacher_id: schedule.teacher_id,
          lesson_date: schedule.lesson_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          current_participants: Number(schedule.current_participants ?? 0),
          status: schedule.status,
          teacher: teacherMap.get(schedule.teacher_id) ?? null,
        }));

        const mappedDirections: Direction[] = activityTypes.map((activity) => {
          const subscriptionType = Array.isArray(activity.subscription_types)
            ? activity.subscription_types[0] ?? null
            : activity.subscription_types ?? null;

          const activitySchedules = mappedSchedules.filter(
            (schedule) => schedule.activity_type_id === activity.id
          );

          const activityTeacher = teacherMap.get(activity.teacher_id) ?? null;

          return {
            id: activity.id,
            name: activity.name,
            description: activity.description ?? "",
            image: getImageUrl(activity.image),
            durationMinutes: Number(activity.duration_minutes ?? 0),
            maxPlaces: Number(activity.max_places ?? 0),
            teacher: activityTeacher,
            subscriptionType,
            schedules: activitySchedules,
          };
        });

        setDirections(mappedDirections);

        const childIds = loadedChildren.map((child) => child.id);

        if (childIds.length > 0) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from("group_bookings")
            .select(`
              id,
              schedule_id,
              child_id,
              user_id,
              subscription_id,
              status
            `)
            .in("child_id", childIds)
            .eq("user_id", user.id)
            .eq("status", "booked");

          if (bookingsError) {
            throw bookingsError;
          }

          setExistingBookings((bookingsData ?? []) as Booking[]);
        } else {
          setExistingBookings([]);
        }
      } catch (loadError: any) {
        console.error("Ошибка загрузки направлений:", loadError);

        setError(
          loadError?.message ||
          "Не удалось загрузить направления"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const categories = useMemo(() => {
    return ["Все"];
  }, []);

  const filteredDirections = useMemo(() => {
    if (activeCategory === "Все") {
      return directions;
    }

    return directions;
  }, [directions, activeCategory]);

  const openDirection = (direction: Direction) => {
    setSelectedDirection(direction);
    setBookingError(null);
    setBookingSuccess(false);
    setShowAllSchedules(false);

    if (children.length === 1) {
      setSelectedChildId(children[0].id);
    } else {
      setSelectedChildId(null);
    }

    setSelectedSchedule(direction.schedules[0] ?? null);
  };

  const closeModal = () => {
    if (isBooking) {
      return;
    }

    setSelectedDirection(null);
    setSelectedSchedule(null);
    setSelectedChildId(null);
    setBookingError(null);
    setBookingSuccess(false);
    setShowAllSchedules(false);
  };

  const handleBooking = async () => {
    if (!user?.id) {
      setBookingError("Необходимо войти в аккаунт");
      return;
    }

    if (!selectedDirection) {
      setBookingError("Направление не выбрано");
      return;
    }

    if (!selectedSchedule) {
      setBookingError("Выберите занятие");
      return;
    }

    if (!selectedChildId) {
      setBookingError("Выберите ребёнка");
      return;
    }

    if (!subscription || !isSubscriptionActive(subscription)) {
      setBookingError(
        "Для записи необходимо приобрести или продлить абонемент"
      );
      return;
    }

    if (subscription.lessons_left <= 0) {
      setBookingError("В вашем абонементе закончились занятия");
      return;
    }

    const selectedChild = children.find(
      (child) => child.id === selectedChildId
    );

    if (!selectedChild) {
      setBookingError("Выбранный ребёнок не найден");
      return;
    }

    if (selectedSchedule.current_participants >= selectedDirection.maxPlaces) {
      setBookingError("На это занятие уже нет свободных мест");
      return;
    }

    const alreadyBooked = existingBookings.some(
      (booking) =>
        booking.schedule_id === selectedSchedule.id &&
        booking.child_id === selectedChildId
    );

    if (alreadyBooked) {
      setBookingError(
        "Этот ребёнок уже записан на выбранное занятие"
      );
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const { data: latestSubscription, error: latestSubscriptionError } = await supabase
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
          created_at
        `)
        .eq("id", subscription.id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (latestSubscriptionError) {
        throw latestSubscriptionError;
      }

      if (!latestSubscription) {
        throw new Error("Активный абонемент не найден");
      }

      if (latestSubscription.lessons_left <= 0) {
        throw new Error("В вашем абонементе закончились занятия");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const subscriptionEndDate = new Date(
        `${latestSubscription.end_date}T00:00:00`
      );

      if (subscriptionEndDate < today) {
        throw new Error("Срок действия абонемента закончился");
      }

      const { data: currentSchedule, error: currentScheduleError } = await supabase
        .from("group_schedules")
        .select(`
          id,
          activity_type_id,
          teacher_id,
          lesson_date,
          start_time,
          end_time,
          current_participants,
          status
        `)
        .eq("id", selectedSchedule.id)
        .maybeSingle();

      if (currentScheduleError) {
        throw currentScheduleError;
      }

      if (!currentSchedule) {
        throw new Error("Занятие не найдено");
      }

      if (currentSchedule.status !== "scheduled") {
        throw new Error("Это занятие больше недоступно для записи");
      }

      if (
        Number(currentSchedule.current_participants ?? 0) >=
        selectedDirection.maxPlaces
      ) {
        throw new Error("На это занятие уже нет свободных мест");
      }

      const { data: duplicateBooking, error: duplicateBookingError } = await supabase
        .from("group_bookings")
        .select("id")
        .eq("schedule_id", selectedSchedule.id)
        .eq("child_id", selectedChildId)
        .eq("user_id", user.id)
        .eq("status", "booked")
        .maybeSingle();

      if (duplicateBookingError) {
        throw duplicateBookingError;
      }

      if (duplicateBooking) {
        throw new Error(
          "Этот ребёнок уже записан на выбранное занятие"
        );
      }

      const { error: bookingInsertError } = await supabase
        .from("group_bookings")
        .insert({
          schedule_id: selectedSchedule.id,
          child_id: selectedChildId,
          user_id: user.id,
          subscription_id: latestSubscription.id,
          status: "booked",
          teacher_payout: 0,
        });

      if (bookingInsertError) {
        if (bookingInsertError.code === "23505") {
          throw new Error(
            "Этот ребёнок уже записан на выбранное занятие"
          );
        }

        throw bookingInsertError;
      }

      const newLessonsLeft = Math.max(
        0,
        Number(latestSubscription.lessons_left) - 1
      );

      const { error: subscriptionUpdateError } = await supabase
        .from("user_subscriptions")
        .update({
          lessons_left: newLessonsLeft,
        })
        .eq("id", latestSubscription.id)
        .eq("user_id", user.id);

      if (subscriptionUpdateError) {
        console.error(
          "Не удалось обновить количество занятий:",
          subscriptionUpdateError
        );
      }

      const newParticipants =
        Number(currentSchedule.current_participants ?? 0) + 1;

      const { error: scheduleUpdateError } = await supabase
        .from("group_schedules")
        .update({
          current_participants: newParticipants,
        })
        .eq("id", selectedSchedule.id);

      if (scheduleUpdateError) {
        console.error(
          "Не удалось обновить количество участников:",
          scheduleUpdateError
        );
      }

      setExistingBookings((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          schedule_id: selectedSchedule.id,
          child_id: selectedChildId,
          user_id: user.id,
          subscription_id: latestSubscription.id,
          status: "booked",
        },
      ]);

      setSubscription((current) =>
        current
          ? {
              ...current,
              lessons_left: newLessonsLeft,
            }
          : current
      );

      setSelectedSchedule((current) =>
        current
          ? {
              ...current,
              current_participants: newParticipants,
            }
          : current
      );

      setDirections((currentDirections) =>
        currentDirections.map((direction) => ({
          ...direction,
          schedules: direction.schedules.map((schedule) =>
            schedule.id === selectedSchedule.id
              ? {
                  ...schedule,
                  current_participants: newParticipants,
                }
              : schedule
          ),
        }))
      );

      setBookingSuccess(true);
    } catch (bookingLoadError: any) {
      console.error("Ошибка записи:", bookingLoadError);

      setBookingError(
        bookingLoadError?.message ||
        "Не удалось записать ребёнка на занятие"
      );
    } finally {
      setIsBooking(false);
    }
  };

  const displayedSchedules = selectedDirection
    ? showAllSchedules
      ? selectedDirection.schedules
      : selectedDirection.schedules.slice(0, 4)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 w-64 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-2/3 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white">
        <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <X className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Не удалось загрузить направления
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#646cff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#555ce8]"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#646cff]">
                Детский центр
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Направления
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Выберите направление и подходящее занятие для вашего ребёнка.
              </p>
            </div>

            {subscription && isSubscriptionActive(subscription) && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#646cff] shadow-sm">
                  <Check className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Осталось занятий
                  </p>
                  <p className="text-lg font-bold text-slate-950">
                    {subscription.lessons_left}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeCategory === category ? "bg-[#646cff] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {filteredDirections.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
            <div className="max-w-md px-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <CalendarDays className="h-6 w-6" />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Пока нет доступных направлений
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Скоро здесь появятся новые занятия.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDirections.map((direction) => {
              const firstSchedule = direction.schedules[0] ?? null;
              const availablePlaces = firstSchedule
                ? getAvailablePlaces(firstSchedule, direction)
                : 0;

              return (
                <button
                  key={direction.id}
                  type="button"
                  onClick={() => openDirection(direction)}
                  className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {direction.image ? (
                      <img
                        src={direction.image}
                        alt={direction.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#646cff]/15 via-[#646cff]/5 to-slate-100">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-[#646cff] shadow-sm backdrop-blur">
                          <CalendarDays className="h-7 w-7" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                    {direction.subscriptionType && (
                      <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                        {direction.subscriptionType.name}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-slate-950">
                          {direction.name}
                        </h2>

                        {direction.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {direction.description}
                          </p>
                        )}
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-[#646cff]/10 group-hover:text-[#646cff]">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {direction.durationMinutes > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          {direction.durationMinutes} мин
                        </span>
                      )}

                      {firstSchedule && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(firstSchedule.lesson_date)}
                        </span>
                      )}

                      {direction.maxPlaces > 0 && (
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${availablePlaces <= 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"}`}>
                          <Users className="h-3.5 w-3.5" />
                          {availablePlaces > 0
                            ? `${availablePlaces} мест`
                            : "Мест нет"}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Расписание
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {direction.schedules.length > 0
                            ? `${direction.schedules.length} занятий`
                            : "Пока нет занятий"}
                        </p>
                      </div>

                      <span className="text-sm font-bold text-[#646cff]">
                        Подробнее
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDirection && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              disabled={isBooking}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 text-white backdrop-blur transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[92vh] overflow-y-auto">
              <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
                {selectedDirection.image ? (
                  <img
                    src={selectedDirection.image}
                    alt={selectedDirection.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#646cff]/20 via-[#646cff]/5 to-slate-100">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/80 text-[#646cff] shadow-sm backdrop-blur">
                      <CalendarDays className="h-9 w-9" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  {selectedDirection.subscriptionType && (
                    <span className="mb-2 inline-flex rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 backdrop-blur">
                      {selectedDirection.subscriptionType.name}
                    </span>
                  )}

                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    {selectedDirection.name}
                  </h2>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {selectedDirection.description && (
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      О направлении
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">
                      {selectedDirection.description}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {selectedDirection.durationMinutes > 0 && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#646cff] shadow-sm">
                        <Clock className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Продолжительность
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedDirection.durationMinutes} минут
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDirection.maxPlaces > 0 && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#646cff] shadow-sm">
                        <Users className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Размер группы
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          До {selectedDirection.maxPlaces} детей
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDirection.subscriptionType && (
                  <div className="mt-6 rounded-2xl border border-[#646cff]/10 bg-[#646cff]/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#646cff]">
                          Абонемент
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-950">
                          {selectedDirection.subscriptionType.name}
                        </h3>
                      </div>

                      <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                        <p className="text-xs text-slate-400">
                          Занятий
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedDirection.subscriptionType.min_lessons}–{selectedDirection.subscriptionType.max_lessons}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Стоимость занятий зависит от выбранного количества занятий в абонементе.
                    </p>
                  </div>
                )}

                <div className="mt-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">
                        Расписание
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Выберите удобное занятие
                      </p>
                    </div>

                    {selectedDirection.schedules.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllSchedules((current) => !current)}
                        className="flex items-center gap-1 text-sm font-semibold text-[#646cff]"
                      >
                        {showAllSchedules ? "Свернуть" : "Все занятия"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAllSchedules ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {displayedSchedules.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <CalendarDays className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Пока нет доступных занятий
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {displayedSchedules.map((schedule) => {
                        const isSelected =
                          selectedSchedule?.id === schedule.id;

                        const availablePlaces = Math.max(
                          0,
                          selectedDirection.maxPlaces -
                            schedule.current_participants
                        );

                        const isFull = availablePlaces <= 0;

                        return (
                          <button
                            key={schedule.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setBookingError(null);
                            }}
                            className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-[#646cff] bg-[#646cff]/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"} ${isFull ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-[#646cff] text-white" : "bg-slate-100 text-slate-500"}`}>
                                <CalendarDays className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold capitalize text-slate-900">
                                  {formatDateWithWeekday(
                                    schedule.lesson_date
                                  )}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatTime(schedule.start_time)}–{formatTime(schedule.end_time)}
                                  </span>

                                  {schedule.teacher && (
                                    <span>
                                      {getTeacherName(schedule.teacher)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className={`text-xs font-semibold ${isFull ? "text-red-500" : availablePlaces <= 2 ? "text-orange-500" : "text-slate-500"}`}>
                                  {isFull
                                    ? "Нет мест"
                                    : `${availablePlaces} ${availablePlaces === 1 ? "место" : availablePlaces < 5 ? "места" : "мест"}`}
                                </p>

                                {isSelected && (
                                  <div className="mt-1 flex justify-end text-[#646cff]">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedSchedule?.teacher && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Преподаватель
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#646cff]/10 text-sm font-bold text-[#646cff]">
                        {selectedSchedule.teacher.first_name?.charAt(0)?.toUpperCase() ?? "П"}
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {getTeacherName(selectedSchedule.teacher)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-7">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Кто будет заниматься?
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Выберите ребёнка для записи
                    </p>
                  </div>

                  {children.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                      <p className="text-sm font-semibold text-orange-700">
                        У вас пока нет добавленных детей
                      </p>

                      <p className="mt-1 text-xs leading-5 text-orange-600">
                        Добавьте ребёнка в профиле, чтобы записаться на занятие.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {children.map((child) => {
                        const isSelected =
                          selectedChildId === child.id;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              setSelectedChildId(child.id);
                              setBookingError(null);
                            }}
                            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${isSelected ? "border-[#646cff] bg-[#646cff]/5" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                          >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? "bg-[#646cff] text-white" : "bg-slate-100 text-slate-500"}`}>
                              {child.first_name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {[child.first_name, child.last_name].filter(Boolean).join(" ")}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Ребёнок
                              </p>
                            </div>

                            {isSelected && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#646cff] text-white">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!isSubscriptionActive(subscription) && (
                  <div className="mt-6 rounded-2xl border border-[#646cff]/15 bg-[#646cff]/5 p-5">
                    <p className="text-sm font-bold text-slate-950">
                      Для записи нужен активный абонемент
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Приобретите абонемент, чтобы записать ребёнка на выбранное занятие.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        onNavigate?.("subscribe");
                      }}
                      className="mt-4 rounded-xl bg-[#646cff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#555ce8]"
                    >
                      Выбрать абонемент
                    </button>
                  </div>
                )}

                {bookingError && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-semibold leading-6 text-red-600">
                      {bookingError}
                    </p>
                  </div>
                )}

                {bookingSuccess && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          Ребёнок успешно записан!
                        </p>

                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                          Занятие добавлено в расписание. С абонемента списано одно занятие.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isBooking}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Закрыть
                  </button>

                  {!bookingSuccess && (
                    <button
                      type="button"
                      onClick={handleBooking}
                      disabled={
                        isBooking ||
                        !selectedSchedule ||
                        !selectedChildId ||
                        children.length === 0 ||
                        !isSubscriptionActive(subscription)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#555ce8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Записываем...
                        </>
                      ) : (
                        <>
                          Записаться
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}