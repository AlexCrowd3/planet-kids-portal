import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Filter, Search, ChevronLeft, ChevronRight, Calendar, LayoutGrid, LayoutList, X, Clock, User, Check } from "lucide-react";

interface CalendarEvent {
  name: string;
  age: string;
  time: string;
  duration?: string;
  spotsLeft?: number;
  enrolled?: boolean;
  category?: string;
  teacher?: string;
  description?: string;
}

interface DayEvents {
  label: string;
  events: CalendarEvent[];
}

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const weekDayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const schedule: DayEvents[] = [
  {
    label: "Сегодня",
    events: [
      { name: "Рисование", age: "6+", time: "16:00", duration: "45 минут", spotsLeft: 5, category: "Творчество", teacher: "Евгений Викторович", description: "На этом уроке дети могут: размазывать и растирать пластилин пальцами, создавая фон и плавные переходы цвета; смешивать разные цвета пластилина." },
      { name: "Робототехника", age: "7+", time: "17:00", duration: "60 минут", enrolled: true, category: "Наука", teacher: "Алексей Петрович", description: "Проектирование и сборка подвижного робота на базе Arduino." },
    ],
  },
  {
    label: "Завтра",
    events: [
      { name: "Пластилинография", age: "3+", time: "15:00", duration: "45 минут", spotsLeft: 1, category: "Творчество", teacher: "Евгений Викторович", description: "На этом уроке дети могут: размазывать и растирать пластилин пальцами, создавая фон и плавные переходы цвета; смешивать разные цвета." },
    ],
  },
  {
    label: "Январь, 24",
    events: [
      { name: "Шахматы", age: "4+", time: "17:00", duration: "45 минут", spotsLeft: 4, category: "Логика", teacher: "Иван Сергеевич", description: "Стратегическое мышление и планирование ходов." },
      { name: "Театр", age: "1+", time: "19:00", duration: "60 минут", spotsLeft: 2, category: "Творчество", teacher: "Мария Ивановна", description: "Развитие актёрских навыков через игровые упражнения." },
      { name: "Программирование", age: "7+", time: "19:00", duration: "60 минут", spotsLeft: 3, category: "Наука", teacher: "Алексей Петрович", description: "Основы программирования через создание игр на Scratch." },
    ],
  },
];

const allCategories = ["Все", "Творчество", "Наука", "Логика", "Спорт"];

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0); // January
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(25);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [enrollChildren, setEnrollChildren] = useState<string[]>([]);

  // Generate week days based on offset
  const baseDate = 22 + weekOffset * 7;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = baseDate + i;
    return { date: date > 0 ? date : 1, day: weekDayNames[i], isToday: date === 25 && weekOffset === 0 };
  });

  // Generate month calendar
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const filteredSchedule = schedule
    .map((g) => ({
      ...g,
      events: g.events.filter((e) => {
        const matchCat = activeCategory === "Все" || e.category === activeCategory;
        const matchSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      }),
    }))
    .filter((g) => g.events.length > 0);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const toggleChildEnroll = (child: string) => {
    setEnrollChildren((prev) => prev.includes(child) ? prev.filter((c) => c !== child) : [...prev, child]);
  };

  const highlightDates = [9, 12, 13, 18, 22, 26, 1]; // example highlighted dates

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-primary-opacity">Календарь</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === "week" ? "month" : "week")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={viewMode === "week" ? "Месяц" : "Неделя"}>
            {viewMode === "week" ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
          </button>
          {/* Mobile filter button */}
          <button onClick={() => setShowFilters(true)} className="lg:hidden w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Calendar view */}
          {viewMode === "week" ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
                {weekDays.map((day) => (
                  <button key={day.date} onClick={() => setSelectedDate(day.date)} className={`flex flex-col items-center min-w-[44px] py-2 px-2 rounded-xl transition-all ${selectedDate === day.date ? "gradient-primary text-primary-foreground" : day.isToday ? "bg-primary/10 text-primary font-bold" : "text-primary-opacity hover:bg-secondary"}`}>
                    <span className="text-lg font-bold">{day.date}</span>
                    <span className="text-xs">{day.day}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
                <h3 className="font-bold text-primary-opacity">{months[currentMonth]} {currentYear}</h3>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-secondary-opacity mb-2">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => <span key={d} className="py-1">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <span key={`prev-${i}`} className="py-2 text-sm text-muted-foreground/40">{prevMonthDays - firstDayOfWeek + 1 + i}</span>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const isSelected = selectedDate === d;
                  const isHighlighted = highlightDates.includes(d);
                  return (
                    <button key={d} onClick={() => setSelectedDate(d)} className={`py-2 text-sm rounded-lg transition-all ${isSelected ? "gradient-primary text-primary-foreground font-bold" : isHighlighted ? "bg-primary/15 text-primary font-semibold" : "text-primary-opacity hover:bg-secondary"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="space-y-5">
            {filteredSchedule.map((dayGroup) => (
              <div key={dayGroup.label}>
                <h2 className="font-bold text-primary-opacity mb-3">{dayGroup.label}</h2>
                <div className="space-y-2">
                  {dayGroup.events.map((event, idx) => (
                    <div key={idx} onClick={() => { setSelectedEvent(event); setEnrollChildren([]); }} className={`glass-card p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] hover:shadow-elevated ${event.enrolled ? "border-2 border-primary/40" : ""}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary-opacity">{event.name}</span>
                          <span className="text-sm font-semibold text-primary">{event.age}</span>
                        </div>
                        {event.enrolled ? (
                          <span className="text-sm font-semibold text-primary">Вы записаны!</span>
                        ) : (
                          <span className="text-sm text-secondary-opacity">Осталось мест: {event.spotsLeft}</span>
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

        {/* Desktop filters */}
        <div className="hidden lg:block space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-primary-opacity">Фильтры</h3>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Поиск занятия..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-opacity mb-2">Категория</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity hover:bg-secondary/80"}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-bold text-primary-opacity mb-2">Как записаться?</h3>
            <p className="text-sm text-secondary-opacity">Нажмите на занятие, чтобы увидеть подробности и записать ребёнка.</p>
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-[90] flex items-end">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full bg-background rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-primary-opacity text-lg">Фильтры</h3>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Поиск занятия..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <p className="text-sm font-semibold text-primary-opacity mb-2">Категория</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {allCategories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity"}`}>{cat}</button>
              ))}
            </div>
            <button onClick={() => setShowFilters(false)} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold">Применить</button>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full md:max-w-md bg-background md:rounded-2xl rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center mb-3 md:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-primary-opacity">{selectedEvent.name}</h2>
              <span className="text-lg font-bold text-primary">{selectedEvent.age}</span>
            </div>

            <div className="gradient-primary text-primary-foreground rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{selectedEvent.duration || "45 минут"}</span>
            </div>

            <p className="text-sm text-secondary-opacity mb-4 leading-relaxed">{selectedEvent.description}</p>

            {selectedEvent.teacher && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-primary-opacity mb-2">Преподаватель</p>
                <div className="glass-card px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-primary-opacity">{selectedEvent.teacher}</span>
                </div>
              </div>
            )}

            {!selectedEvent.enrolled ? (
              <>
                <p className="text-sm font-semibold text-primary-opacity mb-2">Кого записать?</p>
                <div className="space-y-2 mb-4">
                  {user.children.map((child) => (
                    <button key={child} onClick={() => toggleChildEnroll(child)} className={`w-full glass-card px-4 py-3 flex items-center gap-3 transition-all ${enrollChildren.includes(child) ? "border-2 border-primary" : ""}`}>
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${enrollChildren.includes(child) ? "border-primary bg-primary" : "border-border"}`}>
                        {enrollChildren.includes(child) && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                      <span className="font-medium text-primary-opacity">{child}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setSelectedEvent(null)} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
                  Записаться
                  <span className="block text-sm font-normal text-white/80">{selectedEvent.time}</span>
                </button>
              </>
            ) : (
              <div className="w-full bg-primary/10 text-primary py-4 rounded-2xl font-bold text-lg text-center">
                Вы записаны ✓
                <span className="block text-sm font-normal">{selectedEvent.time}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
