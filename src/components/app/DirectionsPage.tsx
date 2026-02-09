import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DirectionCard from "@/components/shared/DirectionCard";
import { Filter, Search, X, Clock, User, Check, ChevronDown } from "lucide-react";

interface DirectionData {
  name: string;
  age: string;
  description: string;
  days: string[];
  times?: string[];
  extraDays?: number;
  category: string;
  duration?: string;
  teacher?: string;
  fullDescription?: string;
}

const directionsData: DirectionData[] = [
  { name: "Робототехника", age: "7+", description: "Спроектируйте и соберите собственного подвижного робота, освоив основы схемотехники и программирования на Arduino.", days: ["ПН", "ВТ"], times: ["16:00", "17:00"], extraDays: 2, category: "Наука", duration: "60 минут", teacher: "Алексей Петрович", fullDescription: "На занятиях дети изучают основы электроники, схемотехники и программирования. Каждый ученик собирает своего робота и программирует его поведение." },
  { name: "Рисование", age: "6+", description: "Освойте основы композиции и поработайте с акварелью в лёгкой, воздушной технике.", days: ["ПН", "СР", "ПТ"], times: ["16:00", "15:00", "18:00"], category: "Творчество", duration: "45 минут", teacher: "Евгений Викторович", fullDescription: "На этом уроке дети могут: размазывать и растирать пластилин пальцами, создавая фон и плавные переходы цвета; смешивать разные цвета пластилина для получения новых оттенков." },
  { name: "Театр", age: "1+", description: "Развивайте актёрские навыки, пластику и уверенность на сцене через игровые упражнения и постановки.", days: ["ВТ", "ЧТ"], times: ["19:00", "19:00"], category: "Творчество", duration: "60 минут", teacher: "Мария Ивановна", fullDescription: "Театральная студия развивает уверенность в себе, навыки публичных выступлений и творческое мышление через игровые упражнения." },
  { name: "Шахматы", age: "4+", description: "Научитесь стратегически мыслить и планировать ходы. Подходит для всех уровней.", days: ["СР", "ПТ"], times: ["17:00", "17:00"], category: "Логика", duration: "45 минут", teacher: "Иван Сергеевич", fullDescription: "Занятия шахматами развивают логическое и стратегическое мышление, память и внимание." },
  { name: "Пластилинография", age: "3+", description: "Развивайте мелкую моторику и творческое мышление через работу с пластилином.", days: ["ПН", "СР"], times: ["15:00", "15:00"], extraDays: 1, category: "Творчество", duration: "45 минут", teacher: "Евгений Викторович", fullDescription: "На этом уроке дети могут: размазывать и растирать пластилин пальцами, создавая фон и плавные переходы цвета." },
  { name: "Программирование", age: "7+", description: "Изучайте основы программирования через создание игр и интерактивных проектов.", days: ["ВТ", "ЧТ"], times: ["19:00", "19:00"], category: "Наука", duration: "60 минут", teacher: "Алексей Петрович", fullDescription: "Дети создают собственные игры и интерактивные проекты на Scratch и Python." },
  { name: "Музыка", age: "3+", description: "Вокал, ритмика и знакомство с музыкальными инструментами.", days: ["ПН", "ПТ"], times: ["15:00", "16:00"], category: "Творчество", duration: "45 минут", teacher: "Ольга Николаевна", fullDescription: "Развиваем слух, чувство ритма и знакомимся с различными музыкальными инструментами." },
];

const allCategories = ["Все", "Творчество", "Наука", "Логика"];
const allAges = ["Все", "1+", "3+", "4+", "6+", "7+"];

const DirectionsPage = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeAge, setActiveAge] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<DirectionData | null>(null);
  const [enrollChildren, setEnrollChildren] = useState<string[]>([]);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const filtered = directionsData.filter((dir) => {
    const matchesCat = activeCategory === "Все" || dir.category === activeCategory;
    const matchesAge = activeAge === "Все" || dir.age === activeAge;
    const matchesSearch = !searchQuery || dir.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesAge && matchesSearch;
  });

  const toggleChildEnroll = (child: string) => {
    setEnrollChildren((prev) => prev.includes(child) ? prev.filter((c) => c !== child) : [...prev, child]);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-primary-opacity">Направления</h1>
        <button onClick={() => setShowFilters(true)} className="lg:hidden w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar - full width */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Поиск направления..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((dir, idx) => (
              <div key={idx} onClick={() => { setSelectedDirection(dir); setEnrollChildren([]); setShowFullDesc(false); }}>
                <DirectionCard {...dir} />
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-secondary-opacity text-sm text-center py-8">Ничего не найдено</p>
          )}
        </div>

        {/* Desktop filters */}
        <div className="hidden lg:block space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-primary-opacity">Фильтры</h3>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-primary-opacity mb-2">Категория</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity hover:bg-secondary/80"}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-opacity mb-2">Возраст</p>
              <div className="flex flex-wrap gap-2">
                {allAges.map((age) => (
                  <button key={age} onClick={() => setActiveAge(age)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeAge === age ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity hover:bg-secondary/80"}`}>{age}</button>
                ))}
              </div>
            </div>
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
            <div className="mb-4">
              <p className="text-sm font-semibold text-primary-opacity mb-2">Категория</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity"}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-primary-opacity mb-2">Возраст</p>
              <div className="flex flex-wrap gap-2">
                {allAges.map((age) => (
                  <button key={age} onClick={() => setActiveAge(age)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeAge === age ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-opacity"}`}>{age}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowFilters(false)} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold">Применить</button>
          </div>
        </div>
      )}

      {/* Direction Detail Modal */}
      {selectedDirection && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setSelectedDirection(null)} />
          <div className="relative w-full md:max-w-md bg-background md:rounded-2xl rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center mb-3 md:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <button onClick={() => setSelectedDirection(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-primary-opacity">{selectedDirection.name}</h2>
              <span className="text-lg font-bold text-primary">{selectedDirection.age}</span>
            </div>

            <div className="gradient-primary text-primary-foreground rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{selectedDirection.duration || "45 минут"}</span>
            </div>

            <p className="text-sm text-secondary-opacity mb-2 leading-relaxed">
              {showFullDesc ? selectedDirection.fullDescription : (selectedDirection.fullDescription?.slice(0, 120) + "...")}
            </p>
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="gradient-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 mb-4">
              {showFullDesc ? "Скрыть" : "Показать"} <ChevronDown className={`w-3 h-3 transition-transform ${showFullDesc ? "rotate-180" : ""}`} />
            </button>

            {selectedDirection.teacher && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-primary-opacity mb-2">Преподаватель</p>
                <div className="glass-card px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-primary-opacity">{selectedDirection.teacher}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-semibold text-primary-opacity mb-2">Расписание</p>
              <div className="flex gap-2">
                {selectedDirection.days.map((day, i) => (
                  <div key={day} className="gradient-primary text-primary-foreground rounded-lg px-3 py-2 text-center">
                    <span className="font-bold text-sm block">{day}</span>
                    <span className="text-xs text-white/80">{selectedDirection.times?.[i] || ""}</span>
                  </div>
                ))}
              </div>
            </div>

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

            <button onClick={() => setSelectedDirection(null)} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
              Записаться
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectionsPage;
