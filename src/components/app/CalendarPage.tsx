import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LayoutGrid,
  LayoutList,
  Loader2,
  Search,
  User,
  Users,
  X,
  BookOpen,
} from "lucide-react";

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
    level_value?: number;
    is_individual: boolean;
    min_lessons?: number;
    max_lessons?: number;
    base_price_per_lesson?: number;
  } | null;
}

interface ActivityType {
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
    level_value?: number;
    is_individual: boolean;
  } | null;
}

interface GroupSchedule {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  status: string;
  day_of_week: number;
  activity_types: ActivityType | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
}

interface IndividualActivity {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  price_per_lesson: number;
  teacher_payout_per_lesson: number;
  duration_minutes: number;
  is_active: boolean;
  activity_types: ActivityType | null;
}

interface IndividualSchedule {
  id: string;
  individual_activity_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  status: string;
  day_of_week: number;
  individual_activities: IndividualActivity | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
}

interface GroupBooking {
  id: string;
  schedule_id: string;
  child_id: string;
  user_id: string;
  subscription_id: string;
  status: string;
  teacher_payout: number;
  lesson_date: string;
  created_at: string;
}

interface IndividualBooking {
  id: string;
  schedule_id: string;
  child_id: string;
  user_id: string;
  subscription_id: string;
  status: string;
  teacher_payout: number;
  lesson_date: string;
  created_at: string;
}

interface GroupCancellation {
  id: string;
  schedule_id: string;
  lesson_date: string;
  reason: string | null;
}

interface IndividualCancellation {
  id: string;
  schedule_id: string;
  lesson_date: string;
  reason: string | null;
}

type EventType = "group" | "individual";

interface CalendarEvent {
  id: string;
  type: EventType;
  scheduleId: string;
  lessonDate: string;
  name: string;
  age: string;
  time: string;
  endTime: string;
  duration: number;
  spotsLeft: number;
  maxPlaces: number | null;
  category: string;
  teacher: string;
  description: string;
  image: string | null;
  bookedChildIds: string[];
  bookedChildren: Child[];
  status: string;
  cancelled: boolean;
  cancellationReason: string | null;
  bookingIdsByChild: Record<string, string>;
}

type ViewMode = "week" | "month";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const getStartOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const getMonday = (date: Date) => {
  const result = getStartOfDay(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;
};

const getIsoDay = (date: Date) => {
  const day = date.getDay();

  return day === 0 ? 7 : day;
};

const formatTime = (time: string) => {
  if (!time) return "";

  return time.slice(0, 5);
};

const formatLongDate = (date: Date) => {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
};

const formatFullDate = (date: Date) => {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getChildName = (child: Child) => {
  return [child.first_name, child.last_name]
    .filter(Boolean)
    .join(" ");
};

const getTeacherName = (
  teacher: {
    first_name: string;
    last_name: string | null;
  } | null
) => {
  if (!teacher) return "Преподаватель";

  return [teacher.first_name, teacher.last_name]
    .filter(Boolean)
    .join(" ");
};

const isActiveBooking = (status: string) => {
  return (
    status === "booked" ||
    status === "confirmed"
  );
};

const CalendarPage = () => {
  const { user } = useAuth();

  const today = useMemo(() => getStartOfDay(new Date()), []);

  const maxBookingDate = useMemo(
    () => addMonths(today, 1),
    [today]
  );

  const [children, setChildren] = useState<Child[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [groupSchedules, setGroupSchedules] = useState<
    GroupSchedule[]
  >([]);

  const [
    individualSchedules,
    setIndividualSchedules,
  ] = useState<IndividualSchedule[]>([]);

  const [groupBookings, setGroupBookings] = useState<
    GroupBooking[]
  >([]);

  const [
    individualBookings,
    setIndividualBookings,
  ] = useState<IndividualBooking[]>([]);

  const [
    groupCancellations,
    setGroupCancellations,
  ] = useState<GroupCancellation[]>([]);

  const [
    individualCancellations,
    setIndividualCancellations,
  ] = useState<IndividualCancellation[]>([]);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState<Date>(today);

  const [weekStart, setWeekStart] = useState<Date>(
    getMonday(today)
  );

  const [viewMode, setViewMode] =
    useState<ViewMode>("week");

  const [activeCategory, setActiveCategory] =
    useState("Все");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  const [selectedChildren, setSelectedChildren] =
    useState<string[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const todayKey = formatDateKey(today);
  const maxBookingDateKey =
    formatDateKey(maxBookingDate);

  const loadCalendarData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        childrenResult,
        subscriptionResult,
        groupSchedulesResult,
        individualSchedulesResult,
      ] = await Promise.all([
        supabase
          .from("children")
          .select(
            "id, first_name, last_name, birth_date, gender"
          )
          .eq("parent_id", user.id)
          .order("created_at", {
            ascending: true,
          }),

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
          .from("group_schedules")
          .select(`
            id,
            activity_type_id,
            teacher_id,
            start_time,
            end_time,
            status,
            day_of_week,
            activity_types (
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
            ),
            teacher:users!group_schedules_teacher_id_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .eq("status", "scheduled"),

        supabase
          .from("individual_schedules")
          .select(`
            id,
            individual_activity_id,
            teacher_id,
            start_time,
            end_time,
            is_booked,
            status,
            day_of_week,
            individual_activities (
              id,
              activity_type_id,
              teacher_id,
              price_per_lesson,
              teacher_payout_per_lesson,
              duration_minutes,
              is_active,
              activity_types (
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
              )
            ),
            teacher:users!individual_schedules_teacher_id_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .eq("status", "scheduled"),
      ]);

      if (childrenResult.error) {
        throw childrenResult.error;
      }

      if (subscriptionResult.error) {
        throw subscriptionResult.error;
      }

      if (groupSchedulesResult.error) {
        throw groupSchedulesResult.error;
      }

      if (individualSchedulesResult.error) {
        throw individualSchedulesResult.error;
      }

      const loadedChildren =
        (childrenResult.data ?? []) as Child[];

      const loadedSubscription =
        subscriptionResult.data as Subscription | null;

      const loadedGroupSchedules =
        (groupSchedulesResult.data ??
          []) as GroupSchedule[];

      const loadedIndividualSchedules =
        (individualSchedulesResult.data ??
          []) as IndividualSchedule[];

      setChildren(loadedChildren);
      setSubscription(loadedSubscription);
      setGroupSchedules(loadedGroupSchedules);
      setIndividualSchedules(
        loadedIndividualSchedules
      );

      const groupScheduleIds =
        loadedGroupSchedules.map(
          (schedule) => schedule.id
        );

      const individualScheduleIds =
        loadedIndividualSchedules.map(
          (schedule) => schedule.id
        );

      const [
        groupBookingsResult,
        individualBookingsResult,
        groupCancellationsResult,
        individualCancellationsResult,
      ] = await Promise.all([
        groupScheduleIds.length > 0
          ? supabase
              .from("group_bookings")
              .select(`
                id,
                schedule_id,
                child_id,
                user_id,
                subscription_id,
                status,
                teacher_payout,
                lesson_date,
                created_at
              `)
              .in("schedule_id", groupScheduleIds)
              .gte("lesson_date", todayKey)
              .lte(
                "lesson_date",
                maxBookingDateKey
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        individualScheduleIds.length > 0
          ? supabase
              .from("individual_bookings")
              .select(`
                id,
                schedule_id,
                child_id,
                user_id,
                subscription_id,
                status,
                teacher_payout,
                lesson_date,
                created_at
              `)
              .in(
                "schedule_id",
                individualScheduleIds
              )
              .gte("lesson_date", todayKey)
              .lte(
                "lesson_date",
                maxBookingDateKey
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        groupScheduleIds.length > 0
          ? supabase
              .from("group_schedule_cancellations")
              .select(
                "id, schedule_id, lesson_date, reason"
              )
              .in(
                "schedule_id",
                groupScheduleIds
              )
              .gte("lesson_date", todayKey)
              .lte(
                "lesson_date",
                maxBookingDateKey
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        individualScheduleIds.length > 0
          ? supabase
              .from(
                "individual_schedule_cancellations"
              )
              .select(
                "id, schedule_id, lesson_date, reason"
              )
              .in(
                "schedule_id",
                individualScheduleIds
              )
              .gte("lesson_date", todayKey)
              .lte(
                "lesson_date",
                maxBookingDateKey
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

      if (groupBookingsResult.error) {
        throw groupBookingsResult.error;
      }

      if (individualBookingsResult.error) {
        throw individualBookingsResult.error;
      }

      if (groupCancellationsResult.error) {
        throw groupCancellationsResult.error;
      }

      if (individualCancellationsResult.error) {
        throw individualCancellationsResult.error;
      }

      setGroupBookings(
        (groupBookingsResult.data ??
          []) as GroupBooking[]
      );

      setIndividualBookings(
        (individualBookingsResult.data ??
          []) as IndividualBooking[]
      );

      setGroupCancellations(
        (groupCancellationsResult.data ??
          []) as GroupCancellation[]
      );

      setIndividualCancellations(
        (individualCancellationsResult.data ??
          []) as IndividualCancellation[]
      );
    } catch (err) {
      console.error(
        "Ошибка загрузки календаря:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить календарь."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [user?.id]);

  const allDates = useMemo(() => {
    const dates: Date[] = [];

    let current = new Date(today);

    while (current <= maxBookingDate) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  }, [today, maxBookingDate]);

  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    const groupBookingMap = new Map<
      string,
      GroupBooking[]
    >();

    const individualBookingMap = new Map<
      string,
      IndividualBooking[]
    >();

    const groupCancellationMap = new Map<
      string,
      GroupCancellation
    >();

    const individualCancellationMap = new Map<
      string,
      IndividualCancellation
    >();

    groupBookings.forEach((booking) => {
      if (!isActiveBooking(booking.status)) {
        return;
      }

      const key = `${booking.schedule_id}_${booking.lesson_date}`;

      const current =
        groupBookingMap.get(key) ?? [];

      current.push(booking);

      groupBookingMap.set(key, current);
    });

    individualBookings.forEach((booking) => {
      if (!isActiveBooking(booking.status)) {
        return;
      }

      const key = `${booking.schedule_id}_${booking.lesson_date}`;

      const current =
        individualBookingMap.get(key) ?? [];

      current.push(booking);

      individualBookingMap.set(key, current);
    });

    groupCancellations.forEach((cancellation) => {
      const key = `${cancellation.schedule_id}_${cancellation.lesson_date}`;

      groupCancellationMap.set(key, cancellation);
    });

    individualCancellations.forEach(
      (cancellation) => {
        const key = `${cancellation.schedule_id}_${cancellation.lesson_date}`;

        individualCancellationMap.set(
          key,
          cancellation
        );
      }
    );

    groupSchedules.forEach((schedule) => {
      const activity = schedule.activity_types;

      if (!activity?.is_active) {
        return;
      }

      allDates.forEach((date) => {
        if (
          getIsoDay(date) !==
          schedule.day_of_week
        ) {
          return;
        }

        const lessonDate =
          formatDateKey(date);

        const key = `${schedule.id}_${lessonDate}`;

        const bookings =
          groupBookingMap.get(key) ?? [];

        const cancellation =
          groupCancellationMap.get(key);

        const bookedChildIds =
          bookings.map(
            (booking) => booking.child_id
          );

        const bookedChildren =
          children.filter((child) =>
            bookedChildIds.includes(child.id)
          );

        const bookingIdsByChild: Record<
          string,
          string
        > = {};

        bookings.forEach((booking) => {
          bookingIdsByChild[booking.child_id] =
            booking.id;
        });

        const maxPlaces =
          activity.max_places ?? 0;

        const spotsLeft = cancellation
          ? 0
          : Math.max(
              maxPlaces - bookings.length,
              0
            );

        events.push({
          id: `group_${schedule.id}_${lessonDate}`,
          type: "group",
          scheduleId: schedule.id,
          lessonDate,
          name: activity.name,
          age:
            activity.subscription_types?.name ??
            "Для всех",
          time: formatTime(
            schedule.start_time
          ),
          endTime: formatTime(
            schedule.end_time
          ),
          duration:
            activity.duration_minutes,
          spotsLeft,
          maxPlaces,
          category:
            activity.subscription_types
              ?.name ?? "Другие",
          teacher: getTeacherName(
            schedule.teacher
          ),
          description:
            activity.description ??
            "Описание занятия пока не добавлено.",
          image: activity.image,
          bookedChildIds,
          bookedChildren,
          status: schedule.status,
          cancelled: Boolean(cancellation),
          cancellationReason:
            cancellation?.reason ?? null,
          bookingIdsByChild,
        });
      });
    });

    individualSchedules.forEach((schedule) => {
      const activity =
        schedule.individual_activities
          ?.activity_types;

      const individualActivity =
        schedule.individual_activities;

      if (
        !activity?.is_active ||
        !individualActivity?.is_active
      ) {
        return;
      }

      allDates.forEach((date) => {
        if (
          getIsoDay(date) !==
          schedule.day_of_week
        ) {
          return;
        }

        const lessonDate =
          formatDateKey(date);

        const key = `${schedule.id}_${lessonDate}`;

        const bookings =
          individualBookingMap.get(key) ?? [];

        const cancellation =
          individualCancellationMap.get(key);

        const bookedChildIds =
          bookings.map(
            (booking) => booking.child_id
          );

        const bookedChildren =
          children.filter((child) =>
            bookedChildIds.includes(child.id)
          );

        const bookingIdsByChild: Record<
          string,
          string
        > = {};

        bookings.forEach((booking) => {
          bookingIdsByChild[booking.child_id] =
            booking.id;
        });

        const maxPlaces = 1;

        const isBooked =
          bookings.length > 0 ||
          schedule.is_booked;

        const spotsLeft =
          cancellation || isBooked ? 0 : 1;

        events.push({
          id: `individual_${schedule.id}_${lessonDate}`,
          type: "individual",
          scheduleId: schedule.id,
          lessonDate,
          name: activity.name,
          age:
            activity.subscription_types?.name ??
            "Индивидуальное",
          time: formatTime(
            schedule.start_time
          ),
          endTime: formatTime(
            schedule.end_time
          ),
          duration:
            individualActivity.duration_minutes ??
            activity.duration_minutes,
          spotsLeft,
          maxPlaces,
          category: "Индивидуальное",
          teacher: getTeacherName(
            schedule.teacher
          ),
          description:
            activity.description ??
            "Индивидуальное занятие.",
          image: activity.image,
          bookedChildIds,
          bookedChildren,
          status: schedule.status,
          cancelled: Boolean(cancellation),
          cancellationReason:
            cancellation?.reason ?? null,
          bookingIdsByChild,
        });
      });
    });

    return events.sort((a, b) => {
      if (a.lessonDate !== b.lessonDate) {
        return a.lessonDate.localeCompare(
          b.lessonDate
        );
      }

      return a.time.localeCompare(b.time);
    });
  }, [
    groupSchedules,
    individualSchedules,
    groupBookings,
    individualBookings,
    groupCancellations,
    individualCancellations,
    children,
    allDates,
  ]);

  const categories = useMemo(() => {
    const result = new Set<string>();

    calendarEvents.forEach((event) => {
      if (event.category) {
        result.add(event.category);
      }
    });

    return ["Все", ...Array.from(result)];
  }, [calendarEvents]);

  const filteredEvents = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return calendarEvents.filter((event) => {
      if (
        activeCategory !== "Все" &&
        event.category !== activeCategory
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        event.name
          .toLowerCase()
          .includes(query) ||
        event.teacher
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    calendarEvents,
    activeCategory,
    searchQuery,
  ]);

  const eventsByDate = useMemo(() => {
    const result = new Map<
      string,
      CalendarEvent[]
    >();

    filteredEvents.forEach((event) => {
      const current =
        result.get(event.lessonDate) ?? [];

      current.push(event);

      result.set(event.lessonDate, current);
    });

    return result;
  }, [filteredEvents]);

  const selectedDateKey =
    formatDateKey(selectedDate);

  const selectedDayEvents =
    eventsByDate.get(selectedDateKey) ?? [];

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDays(weekStart, index)
    );
  }, [weekStart]);

  const monthCalendarDays = useMemo(() => {
    const year =
      selectedDate.getFullYear();

    const month =
      selectedDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const firstDayIndex =
      firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

    const result: Array<Date | null> = [];

    for (
      let index = 0;
      index < firstDayIndex;
      index++
    ) {
      result.push(null);
    }

    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {
      result.push(
        new Date(year, month, day)
      );
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [selectedDate]);

  const canGoPreviousWeek = useMemo(() => {
    return addDays(weekStart, 6) >= today;
  }, [weekStart, today]);

  const canGoNextWeek = useMemo(() => {
    return (
      addDays(weekStart, 7) <=
      maxBookingDate
    );
  }, [weekStart, maxBookingDate]);

  const canGoPreviousMonth = useMemo(() => {
    const currentMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );

    const todayMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    return currentMonth > todayMonth;
  }, [selectedDate, today]);

  const canGoNextMonth = useMemo(() => {
    const currentMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );

    const maxMonth = new Date(
      maxBookingDate.getFullYear(),
      maxBookingDate.getMonth(),
      1
    );

    return currentMonth < maxMonth;
  }, [
    selectedDate,
    maxBookingDate,
  ]);

  const subscriptionActive =
    Boolean(
      subscription &&
        subscription.is_active &&
        (!subscription.end_date ||
          parseDateKey(
            subscription.end_date
          ) >= today)
    );

  const handlePreviousWeek = () => {
    if (!canGoPreviousWeek) return;

    setWeekStart(
      addDays(weekStart, -7)
    );
  };

  const handleNextWeek = () => {
    if (!canGoNextWeek) return;

    setWeekStart(
      addDays(weekStart, 7)
    );
  };

  const handlePreviousMonth = () => {
    if (!canGoPreviousMonth) return;

    const nextDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      1
    );

    setSelectedDate(nextDate);
    setWeekStart(getMonday(nextDate));
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;

    const nextDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1
    );

    setSelectedDate(nextDate);
    setWeekStart(getMonday(nextDate));
  };

  const handleSelectDate = (date: Date) => {
    const normalized =
      getStartOfDay(date);

    setSelectedDate(normalized);
    setWeekStart(getMonday(normalized));
  };

  const openEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setError(null);
    setSuccessMessage(null);

    const availableChildren =
      children.filter(
        (child) =>
          !event.bookedChildIds.includes(
            child.id
          )
      );

    if (
      event.type === "individual" &&
      event.bookedChildIds.length === 0 &&
      availableChildren.length === 1
    ) {
      setSelectedChildren([
        availableChildren[0].id,
      ]);
    } else {
      setSelectedChildren([]);
    }
  };

  const closeEvent = () => {
    if (bookingLoading) return;

    setSelectedEvent(null);
    setSelectedChildren([]);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleChild = (childId: string) => {
    if (!selectedEvent) return;

    if (
      selectedEvent.bookedChildIds.includes(
        childId
      )
    ) {
      return;
    }

    if (
      selectedEvent.type === "individual"
    ) {
      setSelectedChildren([childId]);
      return;
    }

    setSelectedChildren((current) =>
      current.includes(childId)
        ? current.filter(
            (id) => id !== childId
          )
        : [...current, childId]
    );
  };

  const handleBooking = async () => {
    if (!user?.id || !selectedEvent) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const lessonDate = parseDateKey(
      selectedEvent.lessonDate
    );

    if (
      lessonDate < today ||
      lessonDate > maxBookingDate
    ) {
      setError(
        "Записаться можно только на занятия в течение ближайшего месяца."
      );
      return;
    }

    if (selectedEvent.cancelled) {
      setError(
        "Это занятие отменено и недоступно для записи."
      );
      return;
    }

    if (selectedChildren.length === 0) {
      setError(
        "Выберите хотя бы одного ребёнка."
      );
      return;
    }

    if (!subscriptionActive || !subscription) {
      setError(
        "Для записи необходимо оформить активную подписку."
      );
      return;
    }

    if (subscription.lessons_left <= 0) {
      setError(
        "У вас закончились занятия по текущей подписке."
      );
      return;
    }

    if (
      subscription.end_date &&
      parseDateKey(
        subscription.end_date
      ) < lessonDate
    ) {
      setError(
        "Ваша подписка заканчивается раньше даты выбранного занятия."
      );
      return;
    }

    if (
      selectedEvent.spotsLeft <
      selectedChildren.length
    ) {
      setError(
        `Свободно мест: ${selectedEvent.spotsLeft}.`
      );
      return;
    }

    const alreadyBooked =
      selectedChildren.some((childId) =>
        selectedEvent.bookedChildIds.includes(
          childId
        )
      );

    if (alreadyBooked) {
      setError(
        "Один из выбранных детей уже записан на это занятие."
      );
      return;
    }

    if (
      selectedChildren.length >
      subscription.lessons_left
    ) {
      setError(
        `У вас осталось только ${subscription.lessons_left} занятий.`
      );
      return;
    }

    if (
      selectedEvent.type === "individual" &&
      selectedChildren.length > 1
    ) {
      setError(
        "На индивидуальное занятие можно записать только одного ребёнка."
      );
      return;
    }

    setBookingLoading(true);

    try {
      if (
        selectedEvent.type === "group"
      ) {
        const records =
          selectedChildren.map(
            (childId) => ({
              schedule_id:
                selectedEvent.scheduleId,
              child_id: childId,
              user_id: user.id,
              subscription_id:
                subscription.id,
              status: "booked",
              teacher_payout: 0,
              lesson_date:
                selectedEvent.lessonDate,
            })
          );

        const { error: insertError } =
          await supabase
            .from("group_bookings")
            .insert(records);

        if (insertError) {
          throw insertError;
        }
      } else {
        const childId =
          selectedChildren[0];

        const { error: insertError } =
          await supabase
            .from("individual_bookings")
            .insert({
              schedule_id:
                selectedEvent.scheduleId,
              child_id: childId,
              user_id: user.id,
              subscription_id:
                subscription.id,
              status: "booked",
              teacher_payout: 0,
              lesson_date:
                selectedEvent.lessonDate,
            });

        if (insertError) {
          throw insertError;
        }

        const { error: scheduleError } =
          await supabase
            .from("individual_schedules")
            .update({
              is_booked: true,
            })
            .eq(
              "id",
              selectedEvent.scheduleId
            );

        if (scheduleError) {
          console.error(
            "Не удалось обновить individual_schedules:",
            scheduleError
          );
        }
      }

      const lessonsUsed =
        selectedChildren.length;

      const newLessonsLeft = Math.max(
        subscription.lessons_left -
          lessonsUsed,
        0
      );

      const {
        error: subscriptionError,
      } = await supabase
        .from("user_subscriptions")
        .update({
          lessons_left: newLessonsLeft,
        })
        .eq("id", subscription.id)
        .eq("user_id", user.id);

      if (subscriptionError) {
        console.error(
          "Ошибка обновления остатка занятий:",
          subscriptionError
        );
      }

      setSubscription((current) =>
        current
          ? {
              ...current,
              lessons_left:
                newLessonsLeft,
            }
          : current
      );

      await loadCalendarData();

      setSuccessMessage(
        selectedChildren.length === 1
          ? "Ребёнок успешно записан на занятие."
          : "Дети успешно записаны на занятие."
      );

      setSelectedChildren([]);
    } catch (err) {
      console.error(
        "Ошибка записи:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось записаться на занятие."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (
    childId: string
  ) => {
    if (!user?.id || !selectedEvent) {
      return;
    }

    const bookingId =
      selectedEvent.bookingIdsByChild[
        childId
      ];

    if (!bookingId) {
      setError(
        "Не удалось найти запись на занятие."
      );
      return;
    }

    const child = children.find(
      (item) => item.id === childId
    );

    const childName = child
      ? getChildName(child)
      : "ребёнка";

    const confirmed =
      window.confirm(
        `Отменить запись ${childName} на занятие?\n\nЗанятие будет освобождено, а одно занятие вернётся на баланс подписки.`
      );

    if (!confirmed) {
      return;
    }

    setBookingLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let bookingSubscriptionId: string | null =
        null;

      if (
        selectedEvent.type === "group"
      ) {
        const { data, error: fetchError } =
          await supabase
            .from("group_bookings")
            .select(
              "id, subscription_id"
            )
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        bookingSubscriptionId =
          data?.subscription_id ?? null;

        const { error: updateError } =
          await supabase
            .from("group_bookings")
            .update({
              status: "cancelled",
            })
            .eq("id", bookingId)
            .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { data, error: fetchError } =
          await supabase
            .from("individual_bookings")
            .select(
              "id, subscription_id"
            )
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        bookingSubscriptionId =
          data?.subscription_id ?? null;

        const { error: updateError } =
          await supabase
            .from("individual_bookings")
            .update({
              status: "cancelled",
            })
            .eq("id", bookingId)
            .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        const { error: scheduleError } =
          await supabase
            .from("individual_schedules")
            .update({
              is_booked: false,
            })
            .eq(
              "id",
              selectedEvent.scheduleId
            );

        if (scheduleError) {
          console.error(
            "Не удалось освободить индивидуальное расписание:",
            scheduleError
          );
        }
      }

      if (bookingSubscriptionId) {
        const { data: currentSubscription } =
          await supabase
            .from("user_subscriptions")
            .select(
              "id, lessons_left"
            )
            .eq(
              "id",
              bookingSubscriptionId
            )
            .eq("user_id", user.id)
            .maybeSingle();

        if (currentSubscription) {
          const { error: updateSubscriptionError } =
            await supabase
              .from("user_subscriptions")
              .update({
                lessons_left:
                  currentSubscription.lessons_left +
                  1,
              })
              .eq(
                "id",
                currentSubscription.id
              )
              .eq("user_id", user.id);

          if (
            updateSubscriptionError
          ) {
            console.error(
              "Не удалось вернуть занятие на баланс:",
              updateSubscriptionError
            );
          }
        }
      }

      await loadCalendarData();

      setSuccessMessage(
        `Запись ${childName} отменена.`
      );
    } catch (err) {
      console.error(
        "Ошибка отмены записи:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отменить запись."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const renderEventCard = (
    event: CalendarEvent,
    compact = false
  ) => {
    const hasBookings =
      event.bookedChildren.length > 0;

    const isFull =
      event.spotsLeft <= 0;

    return (
      <button
        key={event.id}
        onClick={() => openEvent(event)}
        className={`group w-full text-left transition-all ${
          compact
            ? "rounded-xl"
            : "rounded-2xl"
        } ${
          event.cancelled
            ? "border border-red-500/15 bg-red-500/[0.03]"
            : hasBookings
              ? "border border-[#646cff]/20 bg-[#646cff]/[0.04]"
              : "border border-border bg-card hover:-translate-y-0.5 hover:border-[#646cff]/30 hover:shadow-lg"
        }`}
      >
        <div
          className={
            compact ? "p-3" : "p-4"
          }
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {event.type ===
                  "individual" && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-semibold text-purple-500">
                    Индивидуальное
                  </span>
                )}

                {event.cancelled && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-500">
                    Отменено
                  </span>
                )}
              </div>

              <h3 className="text-primary-opacity truncate font-semibold">
                {event.name}
              </h3>

              <p className="text-secondary-opacity mt-0.5 text-xs">
                {event.age}
              </p>
            </div>

            {hasBookings &&
              !event.cancelled && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#646cff]/10 px-2 py-1 text-[10px] font-semibold text-[#646cff]">
                  <Check className="h-3 w-3" />
                  Записан
                </span>
              )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Clock className="text-primary h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-primary-opacity text-sm font-semibold">
                {event.time}
                {event.endTime &&
                  `–${event.endTime}`}
              </p>

              <p className="text-secondary-opacity text-xs">
                {event.duration} мин.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <User className="text-secondary-opacity h-3.5 w-3.5 shrink-0" />

              <span className="text-secondary-opacity truncate text-xs">
                {event.teacher}
              </span>
            </div>

            {!event.cancelled &&
              !hasBookings && (
                <span
                  className={`shrink-0 text-xs font-medium ${
                    isFull
                      ? "text-red-500"
                      : event.spotsLeft <= 2
                        ? "text-orange-500"
                        : "text-notification-success"
                  }`}
                >
                  {isFull
                    ? "Нет мест"
                    : `${event.spotsLeft} ${
                        event.spotsLeft ===
                        1
                          ? "место"
                          : "места"
                      }`}
                </span>
              )}
          </div>

          {hasBookings &&
            !event.cancelled && (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#646cff]/5 px-2.5 py-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#646cff]" />

                <span className="truncate text-xs font-medium text-[#646cff]">
                  {event.bookedChildren.length ===
                  1
                    ? `Записан: ${event.bookedChildren[0].first_name}`
                    : `Записаны: ${event.bookedChildren.length} детей`}
                </span>
              </div>
            )}

          {event.cancelled && (
            <div className="mt-3 rounded-lg bg-red-500/5 px-2.5 py-2 text-xs font-medium text-red-500">
              Занятие отменено
            </div>
          )}

          {!event.cancelled &&
            isFull &&
            !hasBookings && (
              <div className="mt-3 rounded-lg bg-red-500/5 px-2.5 py-2 text-xs font-medium text-red-500">
                Все места заняты
              </div>
            )}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-44 animate-pulse rounded-lg bg-secondary" />

            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-secondary" />
          </div>

          <div className="h-10 w-28 animate-pulse rounded-xl bg-secondary" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-2xl bg-secondary" />

            <div className="h-24 animate-pulse rounded-2xl bg-secondary" />

            <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
          </div>

          <div className="hidden space-y-4 lg:block">
            <div className="h-52 animate-pulse rounded-2xl bg-secondary" />

            <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="gradient-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>

            <div>
              <h1 className="text-primary text-2xl font-bold md:text-3xl">
                Календарь
              </h1>

              <p className="text-secondary-opacity mt-0.5 text-sm">
                Все доступные занятия и расписание
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-secondary p-1">
            <button
              onClick={() =>
                setViewMode("week")
              }
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                viewMode === "week"
                  ? "bg-background text-primary shadow-sm"
                  : "text-secondary-opacity hover:text-primary"
              }`}
            >
              <LayoutList className="h-4 w-4" />

              <span className="hidden sm:inline">
                Неделя
              </span>
            </button>

            <button
              onClick={() =>
                setViewMode("month")
              }
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                viewMode === "month"
                  ? "bg-background text-primary shadow-sm"
                  : "text-secondary-opacity hover:text-primary"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />

              <span className="hidden sm:inline">
                Месяц
              </span>
            </button>
          </div>

          <button
            onClick={() =>
              setShowFilters(
                (value) => !value
              )
            }
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition ${
              showFilters
                ? "text-[#646cff]"
                : "text-secondary-opacity"
            } lg:hidden`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#646cff]/20 bg-[#646cff]/5 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#646cff]/10">
            <Check className="h-4 w-4 text-[#646cff]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#646cff]">
              Готово
            </p>

            <p className="mt-0.5 text-xs text-[#646cff]/80">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {error && !selectedEvent && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-semibold text-red-500">
              Произошла ошибка
            </p>

            <p className="mt-1 text-xs text-red-500/80">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <div className="glass-card overflow-hidden">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-secondary-opacity text-xs">
                  Период записи
                </p>

                <p className="text-primary-opacity mt-0.5 text-sm font-semibold">
                  Сегодня —{" "}
                  {formatFullDate(
                    maxBookingDate
                  )}
                </p>
              </div>

              {subscriptionActive &&
              subscription ? (
                <div className="flex items-center gap-2 rounded-xl bg-[#646cff]/5 px-3 py-2">
                  <BookOpen className="h-4 w-4 text-[#646cff]" />

                  <div>
                    <p className="text-[10px] text-secondary-opacity">
                      Осталось занятий
                    </p>

                    <p className="text-xs font-bold text-[#646cff]">
                      {
                        subscription.lessons_left
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-orange-500/5 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />

                  <span className="text-xs font-medium text-orange-500">
                    Нет активной подписки
                  </span>
                </div>
              )}
            </div>
          </div>

          {viewMode === "week" ? (
            <>
              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-3 py-3 sm:px-5">
                  <button
                    onClick={
                      handlePreviousWeek
                    }
                    disabled={
                      !canGoPreviousWeek
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-opacity transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="min-w-0 text-center">
                    <p className="text-primary-opacity truncate text-sm font-semibold">
                      {formatLongDate(
                        weekDays[0]
                      )}{" "}
                      —{" "}
                      {formatLongDate(
                        weekDays[6]
                      )}
                    </p>

                    <p className="text-secondary-opacity mt-0.5 text-[11px]">
                      {MONTHS[
                        selectedDate.getMonth()
                      ]}{" "}
                      {selectedDate.getFullYear()}
                    </p>
                  </div>

                  <button
                    onClick={handleNextWeek}
                    disabled={
                      !canGoNextWeek
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-opacity transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 border-b border-border">
                  {weekDays.map(
                    (date) => {
                      const key =
                        formatDateKey(
                          date
                        );

                      const isSelected =
                        key ===
                        selectedDateKey;

                      const isToday =
                        key === todayKey;

                      const count =
                        eventsByDate.get(
                          key
                        )?.length ?? 0;

                      return (
                        <button
                          key={key}
                          onClick={() =>
                            handleSelectDate(
                              date
                            )
                          }
                          className={`relative flex min-h-[76px] flex-col items-center justify-center border-r border-border px-1 transition last:border-r-0 hover:bg-secondary/60 ${
                            isSelected
                              ? "bg-[#646cff]/5"
                              : ""
                          }`}
                        >
                          <span className="text-secondary-opacity text-[10px] font-medium uppercase">
                            {date.toLocaleDateString(
                              "ru-RU",
                              {
                                weekday:
                                  "short",
                              }
                            )}
                          </span>

                          <span
                            className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                              isSelected
                                ? "bg-[#646cff] text-white"
                                : isToday
                                  ? "bg-[#646cff]/10 text-[#646cff]"
                                  : "text-primary-opacity"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {count > 0 && (
                            <span
                              className={`absolute bottom-2 h-1 w-1 rounded-full ${
                                isSelected
                                  ? "bg-[#646cff]"
                                  : "bg-[#646cff]/50"
                              }`}
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-primary-opacity text-lg font-bold capitalize">
                      {selectedDate.toLocaleDateString(
                        "ru-RU",
                        {
                          weekday:
                            "long",
                          day: "numeric",
                          month: "long",
                        }
                      )}
                    </h2>

                    <p className="text-secondary-opacity mt-0.5 text-xs">
                      {selectedDayEvents.length > 0
                        ? `${selectedDayEvents.length} ${
                            selectedDayEvents.length ===
                            1
                              ? "занятие"
                              : "занятия"
                          }`
                        : "Занятий нет"}
                    </p>
                  </div>

                  {selectedDateKey ===
                    todayKey && (
                    <span className="shrink-0 rounded-full bg-[#646cff]/10 px-3 py-1.5 text-xs font-semibold text-[#646cff]">
                      Сегодня
                    </span>
                  )}
                </div>

                {selectedDayEvents.length >
                0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedDayEvents.map(
                      (event) =>
                        renderEventCard(
                          event
                        )
                    )}
                  </div>
                ) : (
                  <div className="glass-card flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                      <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <p className="text-primary-opacity font-semibold">
                      На этот день занятий нет
                    </p>

                    <p className="text-secondary-opacity mt-1 max-w-sm text-sm">
                      Выберите другой день,
                      чтобы посмотреть
                      расписание.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <button
                  onClick={
                    handlePreviousMonth
                  }
                  disabled={
                    !canGoPreviousMonth
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-opacity transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-center">
                  <h2 className="text-primary-opacity font-bold">
                    {
                      MONTHS[
                        selectedDate.getMonth()
                      ]
                    }{" "}
                    {selectedDate.getFullYear()}
                  </h2>

                  <p className="text-secondary-opacity mt-0.5 text-[11px]">
                    Запись доступна до{" "}
                    {formatLongDate(
                      maxBookingDate
                    )}
                  </p>
                </div>

                <button
                  onClick={handleNextMonth}
                  disabled={
                    !canGoNextMonth
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-opacity transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-border">
                {DAY_NAMES.map(
                  (day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-secondary-opacity sm:text-xs"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7">
                {monthCalendarDays.map(
                  (date, index) => {
                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="min-h-[70px] border-b border-r border-border bg-secondary/20 sm:min-h-[105px]"
                        />
                      );
                    }

                    const key =
                      formatDateKey(
                        date
                      );

                    const dateEvents =
                      eventsByDate.get(
                        key
                      ) ?? [];

                    const isPast =
                      date < today;

                    const selected =
                      key ===
                      selectedDateKey;

                    const isToday =
                      key === todayKey;

                    return (
                      <button
                        key={key}
                        onClick={() =>
                          handleSelectDate(
                            date
                          )
                        }
                        className={`relative min-h-[70px] border-b border-r border-border p-1.5 text-left transition sm:min-h-[105px] sm:p-2 ${
                          isPast
                            ? "opacity-30"
                            : "hover:bg-secondary/40"
                        } ${
                          selected
                            ? "bg-[#646cff]/5"
                            : ""
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                            selected
                              ? "bg-[#646cff] text-white"
                              : isToday
                                ? "bg-[#646cff]/10 text-[#646cff]"
                                : "text-primary-opacity"
                          }`}
                        >
                          {date.getDate()}
                        </span>

                        <div className="mt-1 space-y-1 overflow-hidden">
                          {dateEvents
                            .slice(0, 2)
                            .map(
                              (event) => (
                                <div
                                  key={
                                    event.id
                                  }
                                  className={`truncate rounded-md px-1.5 py-1 text-[9px] font-medium sm:text-[10px] ${
                                    event.cancelled
                                      ? "bg-red-500/10 text-red-500"
                                      : event.bookedChildIds.length >
                                          0
                                        ? "bg-[#646cff]/10 text-[#646cff]"
                                        : "bg-secondary text-primary-opacity"
                                  }`}
                                >
                                  {
                                    event.time
                                  }{" "}
                                  {
                                    event.name
                                  }
                                </div>
                              )
                            )}

                          {dateEvents.length >
                            2 && (
                            <div className="px-1 text-[9px] font-medium text-secondary-opacity">
                              +
                              {dateEvents.length -
                                2}{" "}
                              ещё
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-primary-opacity text-sm font-semibold">
                      {selectedDate.toLocaleDateString(
                        "ru-RU",
                        {
                          day: "numeric",
                          month: "long",
                        }
                      )}
                    </p>

                    <p className="text-secondary-opacity text-xs">
                      {selectedDayEvents.length
                        ? `${selectedDayEvents.length} ${
                            selectedDayEvents.length ===
                            1
                              ? "занятие"
                              : "занятия"
                          }`
                        : "Занятий нет"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setViewMode(
                        "week"
                      )
                    }
                    className="text-xs font-semibold text-[#646cff]"
                  >
                    Открыть неделю
                  </button>
                </div>

                {selectedDayEvents.length >
                0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedDayEvents.map(
                      (event) =>
                        renderEventCard(
                          event,
                          true
                        )
                    )}
                  </div>
                ) : (
                  <p className="py-5 text-center text-sm text-secondary-opacity">
                    На выбранный день
                    занятий нет.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside
          className={`space-y-5 ${
            showFilters
              ? "block"
              : "hidden"
          } lg:block`}
        >
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-primary-opacity font-bold">
                Фильтры
              </h2>

              <Filter className="h-4 w-4 text-secondary-opacity" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-opacity" />

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Поиск занятия..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-secondary-opacity focus:border-[#646cff]/40 focus:ring-2 focus:ring-[#646cff]/10"
              />
            </div>

            <div className="mt-4">
              <p className="text-secondary-opacity mb-2 text-xs font-semibold uppercase tracking-wide">
                Направление
              </p>

              <div className="flex flex-wrap gap-2">
                {categories.map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setActiveCategory(
                          category
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        activeCategory ===
                        category
                          ? "bg-[#646cff] text-white"
                          : "bg-secondary text-secondary-opacity hover:text-primary"
                      }`}
                    >
                      {category}
                    </button>
                  )
                )}
              </div>
            </div>

            {(activeCategory !==
              "Все" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setActiveCategory(
                    "Все"
                  );
                  setSearchQuery("");
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-opacity transition hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
                Сбросить фильтры
              </button>
            )}
          </div>

          <div className="glass-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#646cff]/10">
                <CalendarDays className="h-5 w-5 text-[#646cff]" />
              </div>

              <div>
                <p className="text-primary-opacity text-sm font-bold">
                  Запись на месяц
                </p>

                <p className="text-secondary-opacity text-xs">
                  Только ближайшие 30–31 день
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-secondary p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary-opacity text-xs">
                  Сегодня
                </span>

                <span className="text-primary-opacity text-right text-xs font-semibold">
                  {formatLongDate(
                    today
                  )}
                </span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary-opacity text-xs">
                  Можно записаться до
                </span>

                <span className="text-primary-opacity text-right text-xs font-semibold">
                  {formatLongDate(
                    maxBookingDate
                  )}
                </span>
              </div>
            </div>

            <p className="text-secondary-opacity mt-3 text-xs leading-5">
              Само расписание отображается
              независимо от подписки. Ограничение
              в месяц действует именно на запись.
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>

              <div>
                <p className="text-primary-opacity text-sm font-bold">
                  Ваши дети
                </p>

                <p className="text-secondary-opacity text-xs">
                  {children.length
                    ? `${children.length} ${
                        children.length ===
                        1
                          ? "ребёнок"
                          : "ребёнка"
                      }`
                    : "Нет детей"}
                </p>
              </div>
            </div>

            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map(
                  (child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <p className="text-primary-opacity truncate text-xs font-medium">
                        {getChildName(
                          child
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-secondary-opacity text-xs leading-5">
                Добавьте ребёнка в профиле,
                чтобы записываться на занятия.
              </p>
            )}
          </div>
        </aside>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEvent();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
            <div className="relative overflow-hidden">
              {selectedEvent.image ? (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.name}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="gradient-primary flex h-36 items-center justify-center">
                  <CalendarDays className="h-12 w-12 text-white/40" />
                </div>
              )}

              <button
                onClick={closeEvent}
                disabled={bookingLoading}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/30 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#646cff]/10 px-2.5 py-1 text-[11px] font-semibold text-[#646cff]">
                    {selectedEvent.age}
                  </span>

                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-opacity">
                    {selectedEvent.category}
                  </span>

                  {selectedEvent.type ===
                    "individual" && (
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-500">
                      Индивидуальное
                    </span>
                  )}

                  {selectedEvent.cancelled && (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-500">
                      Отменено
                    </span>
                  )}
                </div>

                <h2 className="text-primary text-2xl font-bold">
                  {selectedEvent.name}
                </h2>

                <p className="text-secondary-opacity mt-1 text-sm">
                  {formatFullDate(
                    parseDateKey(
                      selectedEvent.lessonDate
                    )
                  )}
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-secondary p-3">
                  <Clock className="text-primary mb-2 h-4 w-4" />

                  <p className="text-secondary-opacity text-[10px]">
                    Время
                  </p>

                  <p className="text-primary-opacity mt-0.5 text-sm font-semibold">
                    {selectedEvent.time}–
                    {
                      selectedEvent.endTime
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-secondary p-3">
                  <Users className="text-primary mb-2 h-4 w-4" />

                  <p className="text-secondary-opacity text-[10px]">
                    Свободно
                  </p>

                  <p className="text-primary-opacity mt-0.5 text-sm font-semibold">
                    {selectedEvent.cancelled
                      ? "—"
                      : selectedEvent.type ===
                          "individual"
                        ? selectedEvent.spotsLeft >
                          0
                          ? "1 место"
                          : "Занято"
                        : `${selectedEvent.spotsLeft} из ${selectedEvent.maxPlaces}`}
                  </p>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-secondary-opacity text-[10px]">
                    Преподаватель
                  </p>

                  <p className="text-primary-opacity text-sm font-semibold">
                    {selectedEvent.teacher}
                  </p>
                </div>
              </div>

              {selectedEvent.cancelled && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <div>
                      <p className="text-xs font-semibold text-red-500">
                        Занятие отменено
                      </p>

                      {selectedEvent.cancellationReason && (
                        <p className="mt-1 text-[11px] leading-5 text-red-500/80">
                          {
                            selectedEvent.cancellationReason
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-primary-opacity mb-2 text-sm font-bold">
                  О занятии
                </h3>

                <p className="text-secondary-opacity text-sm leading-6">
                  {
                    selectedEvent.description
                  }
                </p>
              </div>

              {selectedEvent.bookedChildren
                .length > 0 &&
                !selectedEvent.cancelled && (
                  <div className="mb-5 rounded-xl border border-[#646cff]/15 bg-[#646cff]/5 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#646cff]" />

                      <p className="text-xs font-semibold text-[#646cff]">
                        Уже записаны
                      </p>
                    </div>

                    <div className="space-y-2">
                      {selectedEvent.bookedChildren.map(
                        (child) => (
                          <div
                            key={
                              child.id
                            }
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#646cff]/10">
                                <Check className="h-3.5 w-3.5 text-[#646cff]" />
                              </div>

                              <p className="text-primary-opacity truncate text-sm font-medium">
                                {getChildName(
                                  child
                                )}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleCancelBooking(
                                  child.id
                                )
                              }
                              disabled={
                                bookingLoading
                              }
                              className="shrink-0 rounded-lg bg-red-500/5 px-2.5 py-1.5 text-[10px] font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Отменить
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {!selectedEvent.cancelled &&
                selectedEvent.bookedChildren
                  .length === 0 &&
                selectedEvent.spotsLeft >
                  0 && (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-primary-opacity text-sm font-bold">
                        Записать ребёнка
                      </h3>

                      <span className="text-secondary-opacity text-xs">
                        {selectedEvent.type ===
                        "individual"
                          ? "1 ребёнок"
                          : "Можно выбрать несколько"}
                      </span>
                    </div>

                    {children.length > 0 ? (
                      <div className="space-y-2">
                        {children.map(
                          (child) => {
                            const isSelected =
                              selectedChildren.includes(
                                child.id
                              );

                            return (
                              <button
                                key={
                                  child.id
                                }
                                type="button"
                                onClick={() =>
                                  toggleChild(
                                    child.id
                                  )
                                }
                                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                                  isSelected
                                    ? "border-[#646cff]/30 bg-[#646cff]/5"
                                    : "border-border bg-card hover:border-[#646cff]/20"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                      isSelected
                                        ? "bg-[#646cff]/10"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="h-4 w-4 text-[#646cff]" />
                                    ) : (
                                      <User className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-primary-opacity truncate text-sm font-medium">
                                      {getChildName(
                                        child
                                      )}
                                    </p>

                                    <p className="text-secondary-opacity text-[10px]">
                                      {isSelected
                                        ? "Будет записан"
                                        : "Выбрать ребёнка"}
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    isSelected
                                      ? "border-[#646cff] bg-[#646cff]"
                                      : "border-border"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-secondary p-4 text-center">
                        <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

                        <p className="text-primary-opacity text-xs font-semibold">
                          Дети не добавлены
                        </p>

                        <p className="text-secondary-opacity mt-1 text-[11px]">
                          Добавьте ребёнка в
                          профиле, чтобы
                          записываться на
                          занятия.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {successMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#646cff]/20 bg-[#646cff]/5 p-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#646cff]" />

                  <p className="text-xs leading-5 text-[#646cff]">
                    {successMessage}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                  <p className="text-xs leading-5 text-red-500">
                    {error}
                  </p>
                </div>
              )}

              {!selectedEvent.cancelled &&
                selectedEvent.bookedChildren
                  .length === 0 &&
                !subscriptionActive && (
                  <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />

                      <div>
                        <p className="text-xs font-semibold text-orange-500">
                          Для записи нужна
                          подписка
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-orange-500/80">
                          Вы можете
                          посмотреть всё
                          расписание, но
                          запись доступна
                          только при
                          наличии
                          активной
                          подписки.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {!selectedEvent.cancelled &&
                selectedEvent.bookedChildren
                  .length === 0 &&
                subscriptionActive &&
                subscription &&
                subscription.lessons_left <=
                  0 && (
                  <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                    <p className="text-xs font-semibold text-orange-500">
                      Занятия закончились
                    </p>

                    <p className="mt-1 text-[11px] text-orange-500/80">
                      По вашей текущей
                      подписке больше нет
                      доступных занятий.
                    </p>
                  </div>
                )}

              {!selectedEvent.cancelled &&
                selectedEvent.spotsLeft ===
                  0 &&
                selectedEvent.bookedChildren
                  .length === 0 && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs font-semibold text-red-500">
                      Нет свободных мест
                    </p>

                    <p className="mt-1 text-[11px] text-red-500/80">
                      Все места на это
                      занятие уже заняты.
                    </p>
                  </div>
                )}

              {!selectedEvent.cancelled &&
                selectedEvent.bookedChildren
                  .length === 0 && (
                  <button
                    onClick={
                      handleBooking
                    }
                    disabled={
                      bookingLoading ||
                      selectedChildren.length ===
                        0 ||
                      !subscriptionActive ||
                      !subscription ||
                      subscription.lessons_left <=
                        0 ||
                      selectedEvent.spotsLeft <=
                        0
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#646cff]/20 transition-all hover:-translate-y-0.5 hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Записываем...
                      </>
                    ) : !subscriptionActive ? (
                      <>
                        <BookOpen className="h-4 w-4" />
                        Нужна подписка
                      </>
                    ) : (
                      <>
                        Записаться
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}

              <p className="text-secondary-opacity mt-3 text-center text-[10px] leading-4">
                Расписание доступно для
                просмотра независимо от
                подписки. Запись доступна
                только на ближайший месяц.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;