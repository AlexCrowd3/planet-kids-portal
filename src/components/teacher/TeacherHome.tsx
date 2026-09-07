import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Users, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TeacherSession } from "@/pages/TeacherApp";

type Props = {
  teacher: TeacherSession;
};

type Lesson = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  type: "group" | "individual";
  participants: number;
  maxPlaces: number;
};

const days = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const getNextDate = (dayOfWeek: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay() === 0 ? 7 : today.getDay();

  let diff = dayOfWeek - currentDay;

  if (diff < 0) {
    diff += 7;
  }

  const date = new Date(today);
  date.setDate(today.getDate() + diff);

  return date;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
};

const TeacherHome = ({ teacher }: Props) => {
  const [balance, setBalance] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [{ data: profile }, { data: groupSchedules }, { data: individualSchedules }] =
          await Promise.all([
            supabase
              .from("teacher_profiles")
              .select("balance")
              .eq("teacher_id", teacher.id)
              .maybeSingle(),

            supabase
              .from("group_schedules")
              .select(`
                id,
                start_time,
                end_time,
                day_of_week,
                activity_type_id,
                activity_types (
                  id,
                  name,
                  max_places
                )
              `)
              .eq("teacher_id", teacher.id)
              .eq("status", "scheduled"),

            supabase
              .from("individual_schedules")
              .select(`
                id,
                start_time,
                end_time,
                day_of_week,
                individual_activity_id,
                individual_activities (
                  id,
                  activity_type_id,
                  activity_types (
                    id,
                    name,
                    max_places
                  )
                )
              `)
              .eq("teacher_id", teacher.id)
              .eq("status", "scheduled"),
          ]);

        setBalance(Number(profile?.balance ?? 0));

        const groupIds = (groupSchedules ?? []).map((item) => item.id);
        const individualIds = (individualSchedules ?? []).map((item) => item.id);

        const [{ data: groupBookings }, { data: individualBookings }] =
          await Promise.all([
            groupIds.length
              ? supabase
                  .from("group_bookings")
                  .select("schedule_id, status")
                  .in("schedule_id", groupIds)
              : Promise.resolve({ data: [] }),

            individualIds.length
              ? supabase
                  .from("individual_bookings")
                  .select("schedule_id, status")
                  .in("schedule_id", individualIds)
              : Promise.resolve({ data: [] }),
          ]);

        const isActiveBooking = (status: string | null) => {
          if (!status) return true;

          return ![
            "cancelled",
            "canceled",
            "cancel",
          ].includes(status.toLowerCase());
        };

        const groupLessons: Lesson[] = (groupSchedules ?? []).map((item: any) => {
          const activity = Array.isArray(item.activity_types)
            ? item.activity_types[0]
            : item.activity_types;

          const participants = (groupBookings ?? []).filter(
            (booking: any) =>
              booking.schedule_id === item.id &&
              isActiveBooking(booking.status)
          ).length;

          return {
            id: item.id,
            name: activity?.name ?? "Занятие",
            startTime: item.start_time,
            endTime: item.end_time,
            dayOfWeek: item.day_of_week,
            type: "group",
            participants,
            maxPlaces: Number(activity?.max_places ?? 8),
          };
        });

        const individualLessons: Lesson[] = (
          individualSchedules ?? []
        ).map((item: any) => {
          const individualActivity = Array.isArray(
            item.individual_activities
          )
            ? item.individual_activities[0]
            : item.individual_activities;

          const activity = Array.isArray(
            individualActivity?.activity_types
          )
            ? individualActivity.activity_types[0]
            : individualActivity?.activity_types;

          const participants = (individualBookings ?? []).filter(
            (booking: any) =>
              booking.schedule_id === item.id &&
              isActiveBooking(booking.status)
          ).length;

          return {
            id: item.id,
            name: activity?.name ?? "Индивидуальное занятие",
            startTime: item.start_time,
            endTime: item.end_time,
            dayOfWeek: item.day_of_week,
            type: "individual",
            participants,
            maxPlaces: 1,
          };
        });

        const allLessons = [...groupLessons, ...individualLessons];

        allLessons.sort((a, b) => {
          const dateA = getNextDate(a.dayOfWeek).getTime();
          const dateB = getNextDate(b.dayOfWeek).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return a.startTime.localeCompare(b.startTime);
        });

        setLessons(allLessons.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [teacher.id]);

  const firstName = teacher.firstName;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-secondary-opacity">Добро пожаловать</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          {firstName} 👋
        </h1>
      </div>

      <div className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">Ваш баланс</p>
            <p className="mt-2 text-3xl font-bold">
              {balance.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Ближайшие занятия
            </h2>
            <p className="text-sm text-secondary-opacity">
              Ваше ближайшее расписание
            </p>
          </div>

          <CalendarDays className="h-5 w-5 text-secondary-opacity" />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-secondary-opacity">
            Загружаем расписание...
          </div>
        ) : lessons.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-secondary-opacity">
            Ближайших занятий нет
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const date = getNextDate(lesson.dayOfWeek);

              return (
                <div
                  key={`${lesson.type}-${lesson.id}`}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-primary">
                        {days[lesson.dayOfWeek]} · {formatDate(date)}
                      </p>

                      <h3 className="mt-1 font-semibold text-foreground">
                        {lesson.name}
                      </h3>
                    </div>

                    <span className="rounded-lg bg-secondary px-2 py-1 text-xs text-secondary-opacity">
                      {lesson.type === "group"
                        ? "Группа"
                        : "Индивидуально"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-secondary-opacity">
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {lesson.startTime.slice(0, 5)}–{lesson.endTime.slice(0, 5)}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {lesson.participants}
                      {lesson.type === "group" &&
                        ` / ${lesson.maxPlaces}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherHome;