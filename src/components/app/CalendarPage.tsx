import { useState } from "react";
import { Filter, Search } from "lucide-react";

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
  category?: string;
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
      { name: "Рисование", age: "6+", time: "16:00", spotsLeft: 5, category: "Творчество" },
      { name: "Робототехника", age: "7+", time: "17:00", enrolled: true, category: "Наука" },
    ],
  },
  {
    label: "Завтра",
    events: [
      { name: "Пластилинография", age: "3+", time: "15:00", spotsLeft: 1, category: "Творчество" },
    ],
  },
  {
    label: "Январь, 24",
    events: [
      { name: "Шахматы", age: "4+", time: "17:00", spotsLeft: 4, category: "Логика" },
      { name: "Театр", age: "1+", time: "19:00", spotsLeft: 2, category: "Творчество" },
      { name: "Программирование", age: "7+", time: "19:00", spotsLeft: 3, category: "Наука" },
    ],
  },
];

const allCategories = ["Все", "Творчество", "Наука", "Логика", "Спорт"];

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(25);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchedule = schedule.map((dayGroup) => ({
    ...dayGroup,
    events: dayGroup.events.filter((e) => {
      const matchesCategory = activeCategory === "Все" || e.category === activeCategory;
      const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
  })).filter((g) => g.events.length > 0);

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-opacity mb-5">Календарь</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: calendar + events */}
        <div className="lg:col-span-2 space-y-5">
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
            {filteredSchedule.map((dayGroup) => (
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
            {filteredSchedule.length === 0 && (
              <p className="text-secondary-opacity text-sm text-center py-8">Нет занятий по выбранным фильтрам</p>
            )}
          </div>
        </div>

        {/* Right: filters */}
        <div className="space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-primary-opacity">Фильтры</h3>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск занятия..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Categories */}
            <div>
              <p className="text-sm font-semibold text-primary-opacity mb-2">Категория</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-secondary-opacity hover:bg-secondary/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-primary-opacity mb-2">Как записаться?</h3>
            <p className="text-sm text-secondary-opacity">
              Нажмите на занятие, чтобы увидеть подробности и записать ребёнка. Вы также можете связаться с нами по телефону.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
