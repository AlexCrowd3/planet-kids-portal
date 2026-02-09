import { useState } from "react";
import DirectionCard from "@/components/shared/DirectionCard";
import { Filter, Search } from "lucide-react";

const directionsData = [
  {
    name: "Робототехника",
    age: "7+",
    description: "Спроектируйте и соберите собственного подвижного робота, освоив основы схемотехники и программирования на Arduino.",
    days: ["ПН", "ВТ"],
    extraDays: 2,
    category: "Наука",
  },
  {
    name: "Рисование",
    age: "6+",
    description: "Освойте основы композиции и поработайте с акварелью в лёгкой, воздушной технике. Урок подойдёт как для начинающих.",
    days: ["ПН", "СР", "ПТ"],
    category: "Творчество",
  },
  {
    name: "Театр",
    age: "1+",
    description: "Развивайте актёрские навыки, пластику и уверенность на сцене через игровые упражнения и постановки.",
    days: ["ВТ", "ЧТ"],
    category: "Творчество",
  },
  {
    name: "Шахматы",
    age: "4+",
    description: "Научитесь стратегически мыслить и планировать ходы. Подходит для всех уровней подготовки.",
    days: ["СР", "ПТ"],
    category: "Логика",
  },
  {
    name: "Пластилинография",
    age: "3+",
    description: "Развивайте мелкую моторику и творческое мышление через работу с пластилином и другими материалами.",
    days: ["ПН", "СР"],
    extraDays: 1,
    category: "Творчество",
  },
  {
    name: "Программирование",
    age: "7+",
    description: "Изучайте основы программирования через создание игр и интерактивных проектов на Scratch и Python.",
    days: ["ВТ", "ЧТ"],
    category: "Наука",
  },
  {
    name: "Музыка",
    age: "3+",
    description: "Вокал, ритмика и знакомство с музыкальными инструментами. Развиваем слух и чувство ритма.",
    days: ["ПН", "ПТ"],
    category: "Творчество",
  },
];

const allCategories = ["Все", "Творчество", "Наука", "Логика"];
const allAges = ["Все", "1+", "3+", "4+", "6+", "7+"];

const DirectionsPage = () => {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeAge, setActiveAge] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = directionsData.filter((dir) => {
    const matchesCat = activeCategory === "Все" || dir.category === activeCategory;
    const matchesAge = activeAge === "Все" || dir.age === activeAge;
    const matchesSearch = !searchQuery || dir.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesAge && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-opacity mb-5">Направления</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: direction cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((dir, idx) => (
              <DirectionCard key={idx} {...dir} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-secondary-opacity text-sm text-center py-8">Ничего не найдено</p>
          )}
        </div>

        {/* Right: filters */}
        <div className="space-y-5 order-first lg:order-last">
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
                placeholder="Поиск направления..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Categories */}
            <div className="mb-4">
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

            {/* Age */}
            <div>
              <p className="text-sm font-semibold text-primary-opacity mb-2">Возраст</p>
              <div className="flex flex-wrap gap-2">
                {allAges.map((age) => (
                  <button
                    key={age}
                    onClick={() => setActiveAge(age)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeAge === age
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-secondary-opacity hover:bg-secondary/80"
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectionsPage;
