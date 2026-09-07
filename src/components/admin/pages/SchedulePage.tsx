import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Users,
  UserRound,
  Ban,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SchedulePageProps {}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
}

interface ActivityType {
  id: string;
  name: string;
  duration_minutes: number;
  max_places: number | null;
  teacher_id: string;
  subscription_type_id: string | null;
}

interface IndividualActivity {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  price_per_lesson: number;
  teacher_payout_per_lesson: number;
  duration_minutes: number;
  activity_name: string;
}

interface GroupSchedule {
  id: string;
  activity_type_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  status: string | null;
  day_of_week: number;
}

interface IndividualSchedule {
  id: string;
  individual_activity_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  status: string | null;
  day_of_week: number;
  is_booked: boolean;
}

interface ScheduleOccurrence {
  scheduleId: string;
  type: "group" | "individual";
  date: string;
  activityName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  maxPlaces: number | null;
  participants: number;
  isCancelled: boolean;
  cancellationReason: string | null;
  isBooked: boolean;
}

interface ModalState {
  type: "group" | "individual";
  dayOfWeek: number;
}

const WEEK_DAYS = [
  { value: 1, short: "ПН", name: "Понедельник" },
  { value: 2, short: "ВТ", name: "Вторник" },
  { value: 3, short: "СР", name: "Среда" },
  { value: 4, short: "ЧТ", name: "Четверг" },
  { value: 5, short: "ПТ", name: "Пятница" },
  { value: 6, short: "СБ", name: "Суббота" },
  { value: 7, short: "ВС", name: "Воскресенье" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#646cff] focus:ring-4 focus:ring-[#646cff]/10";

const getMonday = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateRu = (date: Date) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
};

const formatTime = (time: string) => {
  if (!time) return "";

  return time.slice(0, 5);
};

const getTeacherName = (teacher?: Teacher) => {
  if (!teacher) return "Педагог не указан";

  return `${teacher.first_name}${teacher.last_name ? ` ${teacher.last_name}` : ""}`;
};

const SchedulePage = (_props: SchedulePageProps) => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [individualActivities, setIndividualActivities] = useState<
    IndividualActivity[]
  >([]);

  const [groupSchedules, setGroupSchedules] = useState<GroupSchedule[]>([]);
  const [individualSchedules, setIndividualSchedules] = useState<
    IndividualSchedule[]
  >([]);

  const [cancellations, setCancellations] = useState<
    {
      schedule_id: string;
      lesson_date: string;
      reason: string | null;
      type: "group" | "individual";
    }[]
  >([]);

  const [participants, setParticipants] = useState<
    {
      schedule_id: string;
      lesson_date: string;
      count: number;
      type: "group" | "individual";
    }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);

  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedIndividualActivityId, setSelectedIndividualActivityId] =
    useState("");

  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [cancelTarget, setCancelTarget] =
    useState<ScheduleOccurrence | null>(null);

  const [cancelReason, setCancelReason] = useState("");

  const [showPastDays, setShowPastDays] = useState(true);

  const weekDates = useMemo(() => {
    return WEEK_DAYS.map((day, index) => ({
      ...day,
      date: addDays(weekStart, index),
    }));
  }, [weekStart]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [
        teachersResult,
        activitiesResult,
        individualActivitiesResult,
        groupSchedulesResult,
        individualSchedulesResult,
      ] = await Promise.all([
        supabase
          .from("teacher_profiles")
          .select("teacher_id")
          .order("created_at", { ascending: true }),

        supabase
          .from("activity_types")
          .select(
            "id,name,duration_minutes,max_places,teacher_id,subscription_type_id"
          )
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("individual_activities")
          .select(
            "id,activity_type_id,teacher_id,price_per_lesson,teacher_payout_per_lesson,duration_minutes"
          )
          .eq("is_active", true),

        supabase
          .from("group_schedules")
          .select(
            "id,activity_type_id,teacher_id,start_time,end_time,status,day_of_week"
          )
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true }),

        supabase
          .from("individual_schedules")
          .select(
            "id,individual_activity_id,teacher_id,start_time,end_time,status,day_of_week,is_booked"
          )
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

      if (teachersResult.error) throw teachersResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      if (individualActivitiesResult.error)
        throw individualActivitiesResult.error;
      if (groupSchedulesResult.error) throw groupSchedulesResult.error;
      if (individualSchedulesResult.error)
        throw individualSchedulesResult.error;

      const teacherIds =
        teachersResult.data?.map((item) => item.teacher_id) ?? [];

      let teachersData: Teacher[] = [];

      if (teacherIds.length > 0) {
        const { data, error: teachersError } = await supabase
          .from("users")
          .select("id,first_name,last_name,phone")
          .in("id", teacherIds)
          .order("first_name");

        if (teachersError) throw teachersError;

        teachersData = data ?? [];
      }

      const activityMap = new Map(
        (activitiesResult.data ?? []).map((activity) => [
          activity.id,
          activity.name,
        ])
      );

      const normalizedIndividualActivities: IndividualActivity[] = (
        individualActivitiesResult.data ?? []
      ).map((activity) => ({
        id: activity.id,
        activity_type_id: activity.activity_type_id,
        teacher_id: activity.teacher_id,
        price_per_lesson: Number(activity.price_per_lesson),
        teacher_payout_per_lesson: Number(
          activity.teacher_payout_per_lesson
        ),
        duration_minutes: activity.duration_minutes,
        activity_name:
          activityMap.get(activity.activity_type_id) ?? "Направление",
      }));

      setTeachers(teachersData);
      setActivities(activitiesResult.data ?? []);
      setIndividualActivities(normalizedIndividualActivities);
      setGroupSchedules(groupSchedulesResult.data ?? []);
      setIndividualSchedules(individualSchedulesResult.data ?? []);

      await loadWeekDetails(
        weekStart,
        groupSchedulesResult.data ?? [],
        individualSchedulesResult.data ?? []
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить расписание."
      );
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  const loadWeekDetails = async (
    currentWeekStart: Date,
    groups: GroupSchedule[],
    individuals: IndividualSchedule[]
  ) => {
    const currentWeekDates = Array.from({ length: 7 }, (_, index) =>
      addDays(currentWeekStart, index)
    ).map(formatDate);

    const groupIds = groups.map((schedule) => schedule.id);
    const individualIds = individuals.map((schedule) => schedule.id);

    const [groupCancellationsResult, individualCancellationsResult] =
      await Promise.all([
        groupIds.length > 0
          ? supabase
              .from("group_schedule_cancellations")
              .select("schedule_id,lesson_date,reason")
              .in("schedule_id", groupIds)
              .in("lesson_date", currentWeekDates)
          : Promise.resolve({ data: [], error: null }),

        individualIds.length > 0
          ? supabase
              .from("individual_schedule_cancellations")
              .select("schedule_id,lesson_date,reason")
              .in("schedule_id", individualIds)
              .in("lesson_date", currentWeekDates)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (groupCancellationsResult.error) {
      throw groupCancellationsResult.error;
    }

    if (individualCancellationsResult.error) {
      throw individualCancellationsResult.error;
    }

    const groupCancellationItems =
      groupCancellationsResult.data?.map((item) => ({
        ...item,
        type: "group" as const,
      })) ?? [];

    const individualCancellationItems =
      individualCancellationsResult.data?.map((item) => ({
        ...item,
        type: "individual" as const,
      })) ?? [];

    setCancellations([
      ...groupCancellationItems,
      ...individualCancellationItems,
    ]);

    const allParticipants: {
      schedule_id: string;
      lesson_date: string;
      count: number;
      type: "group" | "individual";
    }[] = [];

    if (groupIds.length > 0) {
      const { data, error } = await supabase
        .from("group_bookings")
        .select("schedule_id,lesson_date")
        .in("schedule_id", groupIds)
        .in("lesson_date", currentWeekDates);

      if (error) throw error;

      const counts = new Map<string, number>();

      (data ?? []).forEach((booking) => {
        const key = `${booking.schedule_id}_${booking.lesson_date}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      counts.forEach((count, key) => {
        const [scheduleId, lessonDate] = key.split("_");

        allParticipants.push({
          schedule_id: scheduleId,
          lesson_date: lessonDate,
          count,
          type: "group",
        });
      });
    }

    if (individualIds.length > 0) {
      const { data, error } = await supabase
        .from("individual_bookings")
        .select("schedule_id,lesson_date")
        .in("schedule_id", individualIds)
        .in("lesson_date", currentWeekDates);

      if (error) throw error;

      (data ?? []).forEach((booking) => {
        allParticipants.push({
          schedule_id: booking.schedule_id,
          lesson_date: booking.lesson_date,
          count: 1,
          type: "individual",
        });
      });
    }

    setParticipants(allParticipants);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const teacherMap = useMemo(() => {
    return new Map(teachers.map((teacher) => [teacher.id, teacher]));
  }, [teachers]);

  const activityMap = useMemo(() => {
    return new Map(activities.map((activity) => [activity.id, activity]));
  }, [activities]);

  const individualActivityMap = useMemo(() => {
    return new Map(
      individualActivities.map((activity) => [activity.id, activity])
    );
  }, [individualActivities]);

  const cancellationMap = useMemo(() => {
    return new Map(
      cancellations.map((item) => [
        `${item.type}_${item.schedule_id}_${item.lesson_date}`,
        item,
      ])
    );
  }, [cancellations]);

  const participantMap = useMemo(() => {
    return new Map(
      participants.map((item) => [
        `${item.type}_${item.schedule_id}_${item.lesson_date}`,
        item.count,
      ])
    );
  }, [participants]);

  const occurrencesByDay = useMemo(() => {
    const result = new Map<number, ScheduleOccurrence[]>();

    WEEK_DAYS.forEach((day) => {
      result.set(day.value, []);
    });

    groupSchedules.forEach((schedule) => {
      const activity = activityMap.get(schedule.activity_type_id);
      const teacher = teacherMap.get(schedule.teacher_id);

      if (!activity) return;

      const weekDate = weekDates.find(
        (item) => item.value === schedule.day_of_week
      );

      if (!weekDate) return;

      const date = formatDate(weekDate.date);

      const cancellation = cancellationMap.get(
        `group_${schedule.id}_${date}`
      );

      const key = `group_${schedule.id}_${date}`;

      result.get(schedule.day_of_week)?.push({
        scheduleId: schedule.id,
        type: "group",
        date,
        activityName: activity.name,
        teacherName: getTeacherName(teacher),
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        maxPlaces: activity.max_places,
        participants: participantMap.get(key) ?? 0,
        isCancelled: Boolean(cancellation),
        cancellationReason: cancellation?.reason ?? null,
        isBooked: false,
      });
    });

    individualSchedules.forEach((schedule) => {
      const activity = individualActivityMap.get(
        schedule.individual_activity_id
      );

      const teacher = teacherMap.get(schedule.teacher_id);

      if (!activity) return;

      const weekDate = weekDates.find(
        (item) => item.value === schedule.day_of_week
      );

      if (!weekDate) return;

      const date = formatDate(weekDate.date);

      const cancellation = cancellationMap.get(
        `individual_${schedule.id}_${date}`
      );

      const key = `individual_${schedule.id}_${date}`;

      result.get(schedule.day_of_week)?.push({
        scheduleId: schedule.id,
        type: "individual",
        date,
        activityName: activity.activity_name,
        teacherName: getTeacherName(teacher),
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        maxPlaces: 1,
        participants: participantMap.get(key) ?? 0,
        isCancelled: Boolean(cancellation),
        cancellationReason: cancellation?.reason ?? null,
        isBooked: schedule.is_booked,
      });
    });

    result.forEach((items) => {
      items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return result;
  }, [
    groupSchedules,
    individualSchedules,
    activityMap,
    individualActivityMap,
    teacherMap,
    weekDates,
    cancellationMap,
    participantMap,
  ]);

  const openCreateModal = (type: "group" | "individual", day: number) => {
    setError("");
    setSuccess("");

    setModal({
      type,
      dayOfWeek: day,
    });

    setSelectedActivityId("");
    setSelectedIndividualActivityId("");
    setSelectedTeacherId("");
    setStartTime("");
    setEndTime("");
  };

  const closeModal = () => {
    if (isSaving) return;

    setModal(null);
  };

  const getDurationEndTime = (start: string, duration: number) => {
    if (!start || !duration) return "";

    const [hours, minutes] = start.split(":").map(Number);

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + duration);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (modal?.type !== "group") return;

    const activity = activities.find(
      (item) => item.id === selectedActivityId
    );

    if (!activity || !startTime) return;

    setEndTime(
      getDurationEndTime(startTime, activity.duration_minutes)
    );

    if (activity.teacher_id) {
      setSelectedTeacherId(activity.teacher_id);
    }
  }, [selectedActivityId, startTime, modal?.type, activities]);

  useEffect(() => {
    if (modal?.type !== "individual") return;

    const activity = individualActivities.find(
      (item) => item.id === selectedIndividualActivityId
    );

    if (!activity || !startTime) return;

    setEndTime(
      getDurationEndTime(startTime, activity.duration_minutes)
    );

    if (activity.teacher_id) {
      setSelectedTeacherId(activity.teacher_id);
    }
  }, [
    selectedIndividualActivityId,
    startTime,
    modal?.type,
    individualActivities,
  ]);

  const saveSchedule = async () => {
    if (!modal) return;

    setError("");
    setSuccess("");

    if (!selectedTeacherId) {
      setError("Выберите педагога.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Укажите время начала и окончания.");
      return;
    }

    if (modal.type === "group" && !selectedActivityId) {
      setError("Выберите направление.");
      return;
    }

    if (
      modal.type === "individual" &&
      !selectedIndividualActivityId
    ) {
      setError("Выберите индивидуальное занятие.");
      return;
    }

    setIsSaving(true);

    try {
      if (modal.type === "group") {
        const { error } = await supabase.from("group_schedules").insert({
          activity_type_id: selectedActivityId,
          teacher_id: selectedTeacherId,
          day_of_week: modal.dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("individual_schedules")
          .insert({
            individual_activity_id: selectedIndividualActivityId,
            teacher_id: selectedTeacherId,
            day_of_week: modal.dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_booked: false,
          });

        if (error) throw error;
      }

      setSuccess("Занятие добавлено в постоянное расписание.");
      setModal(null);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить расписание."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSchedule = async (occurrence: ScheduleOccurrence) => {
    const confirmed = window.confirm(
      `Удалить постоянный слот «${occurrence.activityName}» ${formatTime(
        occurrence.startTime
      )} из расписания?\n\nОн исчезнет из всех будущих недель.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const table =
        occurrence.type === "group"
          ? "group_schedules"
          : "individual_schedules";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", occurrence.scheduleId);

      if (error) throw error;

      setSuccess("Слот постоянного расписания удалён.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось удалить расписание."
      );
    }
  };

  const cancelOccurrence = async () => {
    if (!cancelTarget) return;

    setError("");
    setSuccess("");

    try {
      setIsSaving(true);

      if (cancelTarget.type === "group") {
        const { error } = await supabase.rpc("cancel_group_lesson", {
          p_schedule_id: cancelTarget.scheduleId,
          p_lesson_date: cancelTarget.date,
          p_reason: cancelReason.trim() || null,
        });

        if (error) throw error;
      } else {
        const { data: existingCancellation, error: cancellationCheckError } =
          await supabase
            .from("individual_schedule_cancellations")
            .select("id")
            .eq("schedule_id", cancelTarget.scheduleId)
            .eq("lesson_date", cancelTarget.date)
            .maybeSingle();

        if (cancellationCheckError) {
          throw cancellationCheckError;
        }

        if (!existingCancellation) {
          const { error } = await supabase
            .from("individual_schedule_cancellations")
            .insert({
              schedule_id: cancelTarget.scheduleId,
              lesson_date: cancelTarget.date,
              reason: cancelReason.trim() || null,
            });

          if (error) throw error;
        }
      }

      setSuccess(
        cancelTarget.type === "group"
          ? "Занятие отменено. Возврат занятия выполнен автоматически."
          : "Конкретное занятие отменено."
      );

      setCancelTarget(null);
      setCancelReason("");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отменить занятие."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const restoreOccurrence = async (occurrence: ScheduleOccurrence) => {
    const confirmed = window.confirm(
      `Вернуть занятие «${occurrence.activityName}» ${formatTime(
        occurrence.startTime
      )} на ${formatDateRu(new Date(`${occurrence.date}T00:00:00`))}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setIsSaving(true);

      const table =
        occurrence.type === "group"
          ? "group_schedule_cancellations"
          : "individual_schedule_cancellations";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("schedule_id", occurrence.scheduleId)
        .eq("lesson_date", occurrence.date);

      if (error) throw error;

      setSuccess("Отмена снята. Занятие снова доступно.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось восстановить занятие."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const goPreviousWeek = () => {
    setWeekStart((current) => addDays(current, -7));
  };

  const goNextWeek = () => {
    setWeekStart((current) => addDays(current, 7));
  };

  const goCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  const weekTitle = useMemo(() => {
    const end = addDays(weekStart, 6);

    const startText = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(weekStart);

    const endText = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(end);

    return `${startText} — ${endText}`;
  }, [weekStart]);

  const totalSlots = groupSchedules.length + individualSchedules.length;

  const totalThisWeek = Array.from(occurrencesByDay.values()).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#646cff]/10 text-[#646cff]">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Расписание
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  Фиксированное недельное расписание занятий
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goPreviousWeek}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goCurrentWeek}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
            >
              Сегодня
            </button>

            <button
              type="button"
              onClick={goNextWeek}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => loadData()}
              disabled={isLoading}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-[#646cff]/30 hover:text-[#646cff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Обновить
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {weekTitle}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Расписание повторяется каждую неделю. Отмена действует только
              на выбранную дату.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-xs text-slate-400">
                Постоянных слотов
              </span>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                {totalSlots}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-xs text-slate-400">
                На этой неделе
              </span>
              <p className="mt-0.5 text-lg font-bold text-[#646cff]">
                {totalThisWeek}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-xs text-slate-400">
                Педагогов
              </span>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                {teachers.length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <Ban className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#646cff]/10 text-[#646cff]">
              <CalendarDays className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Недельный вид
              </p>
              <p className="text-xs text-slate-400">
                Можно управлять конкретной датой, не изменяя шаблон
                расписания
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPastDays((value) => !value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
          >
            {showPastDays ? "Скрыть прошедшие" : "Показать прошедшие"}
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#646cff]" />
              <p className="text-sm">Загружаем расписание...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {weekDates.map((day) => {
              const dayItems = occurrencesByDay.get(day.value) ?? [];
              const isToday =
                formatDate(day.date) === formatDate(new Date());

              const isPast =
                day.date <
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate()
                );

              return (
                <div
                  key={day.value}
                  className={`flex min-h-[520px] flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                    isToday
                      ? "border-[#646cff]/40 shadow-[0_10px_35px_rgba(100,108,255,0.10)]"
                      : "border-slate-200"
                  } ${isPast && !showPastDays ? "opacity-50" : ""}`}
                >
                  <div
                    className={`border-b px-4 py-4 ${
                      isToday
                        ? "border-[#646cff]/15 bg-[#646cff]/5"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isToday
                              ? "text-[#646cff]"
                              : "text-slate-400"
                          }`}
                        >
                          {day.short}
                        </p>

                        <p className="mt-1 text-base font-bold text-slate-900">
                          {day.name}
                        </p>
                      </div>

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                          isToday
                            ? "bg-[#646cff] text-white shadow-[0_5px_15px_rgba(100,108,255,0.25)]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateRu(day.date)}
                    </p>
                  </div>

                  <div className="flex-1 space-y-3 p-3">
                    {dayItems.length === 0 ? (
                      <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center">
                        <CalendarDays className="mb-3 h-7 w-7 text-slate-300" />

                        <p className="text-sm font-medium text-slate-500">
                          Нет занятий
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Добавьте слот на этот день
                        </p>
                      </div>
                    ) : (
                      dayItems.map((item) => (
                        <ScheduleCard
                          key={`${item.type}_${item.scheduleId}_${item.date}`}
                          item={item}
                          onCancel={() => {
                            if (item.isCancelled) {
                              restoreOccurrence(item);
                            } else {
                              setCancelTarget(item);
                            }
                          }}
                          onDelete={() => deleteSchedule(item)}
                          isSaving={isSaving}
                        />
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
                    <button
                      type="button"
                      onClick={() =>
                        openCreateModal("group", day.value)
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#646cff] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_5px_15px_rgba(100,108,255,0.18)] transition hover:bg-[#555de8]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Группа
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openCreateModal("individual", day.value)
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Инд.
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Добавить занятие
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {WEEK_DAYS.find(
                    (item) => item.value === modal.dayOfWeek
                  )?.name ?? ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <div
                  className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                    modal.type === "group"
                      ? "bg-white text-[#646cff] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Групповое
                </div>

                <div
                  className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                    modal.type === "individual"
                      ? "bg-white text-[#646cff] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Индивидуальное
                </div>
              </div>

              {modal.type === "group" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Направление
                  </label>

                  <select
                    value={selectedActivityId}
                    onChange={(event) =>
                      setSelectedActivityId(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Выберите направление</option>

                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} · {activity.duration_minutes} мин
                      </option>
                    ))}
                  </select>

                  {selectedActivityId && (
                    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      Максимум мест:{" "}
                      <span className="font-semibold text-slate-700">
                        {activityMap.get(selectedActivityId)?.max_places ??
                          "—"}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Индивидуальное занятие
                  </label>

                  <select
                    value={selectedIndividualActivityId}
                    onChange={(event) =>
                      setSelectedIndividualActivityId(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Выберите индивидуальное занятие
                    </option>

                    {individualActivities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.activity_name} ·{" "}
                        {activity.price_per_lesson} ₽
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Педагог
                </label>

                <select
                  value={selectedTeacherId}
                  onChange={(event) =>
                    setSelectedTeacherId(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Выберите педагога</option>

                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {getTeacherName(teacher)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Начало
                  </label>

                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Конец
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#646cff]/10 bg-[#646cff]/5 px-4 py-3">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#646cff]" />

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Важно
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Этот слот будет постоянным и автоматически появится
                      каждую неделю в выбранный день.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={saveSchedule}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_7px_20px_rgba(100,108,255,0.22)] transition hover:bg-[#555de8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохраняем...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Добавить в расписание
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Отменить занятие?
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Отменяется только конкретная дата
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isSaving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#646cff]/10 text-[#646cff]">
                    {cancelTarget.type === "group" ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {cancelTarget.activityName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateRu(
                        new Date(`${cancelTarget.date}T00:00:00`)
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatTime(cancelTarget.startTime)} —{" "}
                      {formatTime(cancelTarget.endTime)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {cancelTarget.teacherName}
                    </p>
                  </div>
                </div>
              </div>

              {cancelTarget.type === "group" &&
                cancelTarget.participants > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800">
                      Записано детей: {cancelTarget.participants}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      При отмене у записанных детей должно автоматически
                      вернуться по одному занятию на абонемент.
                    </p>
                  </div>
                )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Причина отмены
                </label>

                <textarea
                  value={cancelReason}
                  onChange={(event) =>
                    setCancelReason(event.target.value)
                  }
                  rows={3}
                  placeholder="Например: педагог заболел"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Отмена
                </button>

                <button
                  type="button"
                  onClick={cancelOccurrence}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  Отменить занятие
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScheduleCardProps {
  item: ScheduleOccurrence;
  onCancel: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

const ScheduleCard = ({
  item,
  onCancel,
  onDelete,
  isSaving,
}: ScheduleCardProps) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-3 transition-all ${
        item.isCancelled
          ? "border-red-200 bg-red-50/70"
          : item.type === "individual"
          ? "border-violet-100 bg-violet-50/40 hover:border-violet-200"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#646cff]/30 hover:shadow-md"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div
            className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              item.isCancelled
                ? "bg-red-100 text-red-600"
                : item.type === "individual"
                ? "bg-violet-100 text-violet-600"
                : "bg-[#646cff]/10 text-[#646cff]"
            }`}
          >
            {item.isCancelled
              ? "Отменено"
              : item.type === "individual"
              ? "Индивидуальное"
              : "Группа"}
          </div>

          <p
            className={`mt-2 text-lg font-bold ${
              item.isCancelled
                ? "text-red-700 line-through"
                : "text-slate-900"
            }`}
          >
            {formatTime(item.startTime)}
          </p>

          <p className="text-xs text-slate-400">
            до {formatTime(item.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            title="Удалить постоянный слот"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p
          className={`line-clamp-2 text-sm font-semibold ${
            item.isCancelled ? "text-red-700" : "text-slate-800"
          }`}
        >
          {item.activityName}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.teacherName}</span>
        </div>

        {item.type === "group" && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5 shrink-0" />

            <span>
              {item.participants} / {item.maxPlaces ?? "∞"} мест
            </span>
          </div>
        )}

        {item.type === "individual" && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserRound className="h-3.5 w-3.5 shrink-0" />

            <span>
              {item.participants > 0 ? "Забронировано" : "Свободно"}
            </span>
          </div>
        )}

        {item.isCancelled && item.cancellationReason && (
          <div className="rounded-xl bg-red-100/70 px-2.5 py-2 text-[11px] leading-4 text-red-700">
            {item.cancellationReason}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            item.isCancelled
              ? "bg-white text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-50"
              : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
          } disabled:opacity-50`}
        >
          {item.isCancelled ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Восстановить
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" />
              Отменить эту дату
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SchedulePage;