import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TeacherSession } from "@/pages/TeacherApp";

type Props = {
  teacher: TeacherSession;
};

type ScheduleItem = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  type: "group" | "individual";
  participants: number;
  maxPlaces: number;
};

const days = [
  { id: 1, label: "Пн" },
  { id: 2, label: "Вт" },
  { id: 3, label: "Ср" },
  { id: 4, label: "Чт" },
  { id: 5, label: "Пт" },
  { id: 6, label: "Сб" },
  { id: 7, label: "Вс" },
];

const TeacherSchedule = ({ teacher }: Props) => {
  const [selectedDay, setSelectedDay] = useState(
    new Date().getDay() === 0 ? 7 : new Date().getDay()
  );

  const [lessons, setLessons] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [{ data: groupSchedules }, { data: individualSchedules }] =
          await Promise.all([
            supabase
              .from("group_schedules")
              .select(`
                id,
                start_time,
                end_time,
                day_of_week,
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

        const groupIds = (groupSchedules ?? []).map((item) => item.id);
        const individualIds = (individualSchedules ?? []).map(
          (item) => item.id
        );

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

        const groups: ScheduleItem[] = (groupSchedules ?? []).map(
          (item: any) => {
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
          }
        );

        const individuals: ScheduleItem[] = (
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

        const result = [...groups, ...individuals].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        );

        setLessons(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [teacher.id]);

  const filteredLessons = lessons.filter(
    (lesson) => lesson.dayOfWeek === selectedDay
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Расписание
        </h1>

        <p className="mt-1 text-sm text-secondary-opacity">
          Ваше расписание занятий
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 rounded-2xl border border-border bg-card p-2">
        {days.map((day) => {
          const active = selectedDay === day.id;

          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`rounded-xl py-3 text-xs font-semibold transition-all ${active ? "gradient-primary text-primary-foreground" : "text-secondary-opacity hover:bg-secondary hover:text-foreground"}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-secondary-opacity">
          Загружаем расписание...
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-secondary-opacity" />

          <p className="mt-3 font-medium text-foreground">
            В этот день занятий нет
          </p>

          <p className="mt-1 text-sm text-secondary-opacity">
            Выберите другой день недели
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <div
              key={`${lesson.type}-${lesson.id}`}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {lesson.name}
                  </h3>

                  <p className="mt-1 text-xs text-secondary-opacity">
                    {lesson.type === "group"
                      ? "Групповое занятие"
                      : "Индивидуальное занятие"}
                  </p>
                </div>

                <div className="rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-foreground">
                  {lesson.startTime.slice(0, 5)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-secondary-opacity">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {lesson.startTime.slice(0, 5)}–{lesson.endTime.slice(0, 5)}
                </span>

                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {lesson.participants}
                  {lesson.type === "group" && ` / ${lesson.maxPlaces}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;