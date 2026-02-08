import { useState } from "react";

interface CalendarDay {
  date: number;
  day: string;
  isToday?: boolean;
  hasPast?: boolean;
}

interface CalendarEvent {
  name: string;
  age: string;
  time: string;
  spotsLeft?: number;
  enrolled?: boolean;
}

interface DayEvents {
  label: string;
  events: CalendarEvent[];
}

const weekDays: CalendarDay[] = [
  { date: 22, day: "Пн", hasPast: true },
  { date: 23, day: "Вт", hasPast: true },
  { date: 24, day: "Ср" },
  { date: 25, day: "Чт", isToday: true },
  { date: 26, day: "Пт" },
  { date: 27, day: "Сб" },
  { date: 28, day: "Вс" },
];

const schedule: DayEvents[] = [
  {
    label: "Сегодня",
    events: [
      { name: "Рисование", age: "6+", time: "16:00", spotsLeft: 5 },
      { name: "Робототехника", age: "7+", time: "17:00", enrolled: true },
    ],
  },
  {
    label: "Завтра",
    events: [
      { name: "Пластилинография", age: "3+", time: "15:00", spotsLeft: 1 },
    ],
  },
  {
    label: "Январь, 24",
    events: [
      { name: "Шахматы", age: "4+", time: "17:00", spotsLeft: 4 },
      { name: "Театр", age: "1+", time: "19:00", spotsLeft: 2 },
      { name: "Программирование", age: "7+", time: "19:00", spotsLeft: 3 },
    ],
  },
];

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(25);

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-opacity">Календарь</h1>

      {/* Week strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <button
            key={day.date}
            onClick={() => setSelectedDate(day.date)}
            className={`flex flex-col items-center min-w-[44px] py-2 px-2 rounded-xl transition-all ${
              selectedDate === day.date
                ? "gradient-primary text-primary-foreground"
                : day.hasPast
                ? "bg-secondary text-muted-foreground"
                : "text-primary-opacity hover:bg-secondary"
            }`}
          >
            <span className="text-lg font-bold">{day.date}</span>
            <span className="text-xs">{day.day}</span>
          </button>
        ))}
      </div>

      {/* Schedule */}
      <div className="space-y-5">
        {schedule.map((dayGroup) => (
          <div key={dayGroup.label}>
            <h2 className="font-bold text-primary-opacity mb-3">{dayGroup.label}</h2>
            <div className="space-y-2">
              {dayGroup.events.map((event, idx) => (
                <div
                  key={idx}
                  className={`glass-card p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    event.enrolled ? "border-2 border-primary/40" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-opacity">{event.name}</span>
                      <span className="text-sm font-semibold text-primary">{event.age}</span>
                    </div>
                    {event.enrolled ? (
                      <span className="text-sm font-semibold text-primary">Вы записаны!</span>
                    ) : (
                      <span className="text-sm text-secondary-opacity">
                        Осталось мест: {event.spotsLeft}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-primary-opacity">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
