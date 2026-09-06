import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/landing/AuthModal";
import heroChild from "../../assets/your-child-image.png";
import {
  Palette,
  Cpu,
  Music,
  Brain,
  Drama,
  Star,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  Users,
  Building,
  MessageCircle,
  FileText,
  Shield,
  HelpCircle,
  CreditCard,
} from "lucide-react";

const directions = [
  { icon: Palette, name: "Рисование", age: "6+", subscription: "Стартовая" },
  { icon: Cpu, name: "Робототехника", age: "7+", subscription: "Premium+" },
  { icon: Drama, name: "Театр", age: "1+", subscription: "Стандарт" },
  { icon: Brain, name: "Шахматы", age: "4+", subscription: "Стартовая" },
  { icon: Music, name: "Музыка", age: "3+", subscription: "Стандарт" },
  { icon: Sparkles, name: "Пластилинография", age: "3+", subscription: "Стартовая" },
  { icon: Cpu, name: "Программирование", age: "7+", subscription: "Premium+" },
];

const reviews = [
  { name: "Анна М.", text: "Прекрасный центр! Дочка с удовольствием ходит на рисование уже полгода. Педагоги — настоящие профессионалы.", rating: 5 },
  { name: "Игорь К.", text: "Записали сына на робототехнику — в восторге! Каждый раз бежит на занятия. Спасибо команде!", rating: 5 },
  { name: "Мария Д.", text: "Уютная атмосфера, современные методики. Обе дочери занимаются с удовольствием. Рекомендую!", rating: 5 },
];

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { login } = useAuth();
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    login();
    setShowAuth(false);
  };

  const scrollSlider = (dir: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 220;
      sliderRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const subscriptionColor = (sub: string) => {
    if (sub === "Premium+") return "glass-premium text-white";
    if (sub === "Стандарт") return "gradient-orange text-white";
    return "bg-secondary text-secondary-opacity";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="container mx-auto flex items-center justify-between py-3.5 px-4 md:px-6">

          {/* Логотип */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#6E94F5] flex items-center justify-center shadow-md shadow-[#6E94F5]/25">
              <Star className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">Дети на планете</span>
          </div>

          {/* Навигация по центру */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#directions" className="text-sm font-medium text-slate-500 hover:text-[#6E94F5] transition-colors">
              Направления
            </a>
            <a href="#about" className="text-sm font-medium text-slate-500 hover:text-[#6E94F5] transition-colors">
              О нас
            </a>
            <a href="#reviews" className="text-sm font-medium text-slate-500 hover:text-[#6E94F5] transition-colors">
              Отзывы
            </a>
            <a href="#contacts" className="text-sm font-medium text-slate-500 hover:text-[#6E94F5] transition-colors">
              Контакты
            </a>
          </nav>

          {/* Кнопка */}
          <button
            onClick={() => setShowAuth(true)}
            className="bg-[#6E94F5] hover:bg-[#5A82E0] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md shadow-[#6E94F5]/25 transition-all hover:shadow-lg active:scale-95"
          >
            Войти
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white">

        {/* Мягкий фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f7f8ff] to-[#eef1ff]" />

        {/* Декоративные орбы */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #646cff40 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #646cff30 0%, transparent 70%)' }} />

        <div className="relative z-10 container mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ===== Левая часть — текст ===== */}
            <div className="order-2 lg:order-1">

              {/* Бейдж */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-[#6E94F5]/10 border border-[#6E94F5]/20 text-sm font-medium text-[#6E94F5]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6E94F5] opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6E94F5]" />
                </span>
                Развивающий центр • от 1 года
              </div>

              {/* Заголовок */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-[1.15] mb-5 tracking-tight">
                Дети на{' '}
                <span className="bg-gradient-to-r from-[#646cff] to-[#6E94F5] bg-clip-text text-transparent">
                  планете
                </span>
              </h1>

              {/* Описание */}
              <p className="text-lg text-slate-600 max-w-md mb-8 leading-relaxed">
                Творчество, наука и спорт — всё в одном месте.
                Более 10 направлений, опытные педагоги и уютная атмосфера.
              </p>

              {/* Кнопка */}
              <button
                onClick={() => setShowAuth(true)}
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#6E94F5]/25 hover:shadow-xl hover:shadow-[#6E94F5]/40"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#646cff] to-[#6E94F5]" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#646cff] to-[#6E94F5] blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  Записаться
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>

              {/* Адрес и время */}
              <div className="flex flex-wrap items-center gap-5 mt-8 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6E94F5]" />
                    Ясная ул., 14, корп. 1, городской посёлок Янино-1
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6E94F5]" />
                  Пн–Сб 9–20
                </span>
              </div>
            </div>

            {/* ===== Правая часть — картинка + плавающие плашки ===== */}
            <div className="order-1 lg:order-2 relative flex justify-center">

              {/* Картинка ребёнка (сюда вставь свою) */}
              <div className="relative w-full max-w-[420px]">
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-[#646cff]/15 bg-gradient-to-br from-[#e8ebff] to-[#dce1ff]">
                  <img
                    src={heroChild}
                    alt="Ребёнок в центре Дети на планете"
                    className="w-full h-full object-cover"
                  />

                  {/* Лёгкий градиент снизу для красоты */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>

                {/* ========== Плавающие плашки ========== */}

                {/* Плашка 1 — сверху слева */}
                <div className="absolute -top-4 -left-4 sm:-left-8 bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-200/60 border border-slate-100 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#646cff]/10 flex items-center justify-center">
                      <span className="text-lg">🎨</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">10+ направлений</p>
                      <p className="text-xs text-slate-500">творчество и спорт</p>
                    </div>
                  </div>
                </div>

                {/* Плашка 2 — справа посередине */}
                <div className="absolute top-1/3 -right-4 sm:-right-10 bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-200/60 border border-slate-100 animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#646cff]/10 flex items-center justify-center">
                      <span className="text-lg">👨‍🏫</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Опытные педагоги</p>
                      <p className="text-xs text-slate-500">любовь к детям</p>
                    </div>
                  </div>
                </div>

                {/* Плашка 3 — снизу слева */}
                <div className="absolute -bottom-2 left-2 sm:left-6 bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-200/60 border border-slate-100 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-lg">✨</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">От 1 года</p>
                      <p className="text-xs text-slate-500">раннее развитие</p>
                    </div>
                  </div>
                </div>

                {/* Плашка 4 — маленькая декоративная */}
                <div className="absolute top-8 right-4 sm:right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#646cff] to-[#6E94F5] flex items-center justify-center shadow-lg shadow-[#646cff]/30 animate-float-slow">
                  <span className="text-2xl">🪐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative py-24 md:py-32 bg-slate-100">
        <div className="container mx-auto px-6">

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-white border border-slate-200 text-sm text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E94F5]" />
              Наши преимущества
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Почему выбирают{' '}
              <span className="text-[#6E94F5]">нас</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Мы создали место, где дети растут, творят и открывают мир
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Award,
                title: "10+ направлений",
                desc: "От робототехники и науки до театра, танцев и творчества. Каждый найдёт своё.",
              },
              {
                icon: Users,
                title: "Опытные педагоги",
                desc: "Профессионалы с большой любовью к детям и многолетним опытом работы.",
              },
              {
                icon: Building,
                title: "Уютное пространство",
                desc: "Современный ремонт, безопасное оборудование и атмосфера, в которую хочется возвращаться.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#6E94F5]/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#6E94F5] flex items-center justify-center mb-6 shadow-md shadow-[#6E94F5]/25 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directions Slider */}
      <section id="directions" className="relative py-24 md:py-32 bg-white scroll-mt-20 overflow-hidden">

        {/* Лёгкое свечение */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#6E94F5]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-6">

          {/* Заголовок */}
          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-[#6E94F5]/10 border border-[#6E94F5]/20 text-sm text-[#6E94F5] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E94F5]" />
              Более 10 направлений
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Наши{' '}
              <span className="text-[#6E94F5]">
                направления
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Выберите то, что понравится вашему ребёнку
            </p>
          </div>

          {/* Слайдер */}
          <div className="relative">

            {/* Кнопка влево */}
            <button
              onClick={() => scrollSlider("left")}
              className="absolute -left-3 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-700 hover:bg-[#6E94F5]/10 hover:border-[#6E94F5]/30 hover:text-[#6E94F5] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Карточки */}
            <div
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {directions.map((dir) => (
                <div
                  key={dir.name}
                  className="group relative min-w-[240px] max-w-[260px] flex-shrink-0 cursor-pointer"
                >
                  <div className="h-full p-6 rounded-3xl bg-white border border-slate-100 shadow-sm shadow-slate-100/80 hover:shadow-xl hover:shadow-[#6E94F5]/15 hover:border-[#6E94F5]/25 transition-all duration-300 hover:-translate-y-1">

                    {/* Иконка */}
                    <div className="w-14 h-14 rounded-2xl bg-[#6E94F5] flex items-center justify-center mb-5 shadow-md shadow-[#6E94F5]/30 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#6E94F5]/40 transition-all duration-300">
                      <dir.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Название */}
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-[#6E94F5] transition-colors">
                      {dir.name}
                    </h3>

                    {/* Возраст */}
                    <p className="text-sm font-medium text-[#6E94F5] mb-4">
                      {dir.age}
                    </p>

                    {/* Подписка */}
                    <div className="pt-4 border-t border-slate-100">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${subscriptionColor(dir.subscription)}`}>
                        <CreditCard className="w-3.5 h-3.5" />
                        {dir.subscription}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка вправо */}
            <button
              onClick={() => scrollSlider("right")}
              className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-700 hover:bg-[#6E94F5]/10 hover:border-[#6E94F5]/30 hover:text-[#6E94F5] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="relative py-24 md:py-32 bg-slate-100">
        <div className="container mx-auto px-6 max-w-6xl">

          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-white border border-slate-200 text-sm text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E94F5]" />
              Что говорят родители
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Отзывы{' '}
              <span className="text-[#6E94F5]">родителей</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Нам доверяют семьи, и мы очень этим гордимся
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((review) => (
              <div
                key={review.name}
                className="group p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#6E94F5]/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 fill-[#6E94F5] text-[#6E94F5]" />
                  ))}
                </div>

                <p className="text-slate-600 leading-relaxed mb-6 text-[15px]">
                  «{review.text}»
                </p>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#6E94F5]/15 flex items-center justify-center text-[#6E94F5] font-semibold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
                    <p className="text-xs text-slate-400">Родитель</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacts" className="relative py-24 md:py-32 bg-white overflow-hidden">

        {/* Декоративный фон */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E94F5]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-6 max-w-3xl">

          {/* Заголовок */}
          <div className="text-center mb-12 md:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-[#6E94F5]/10 border border-[#6E94F5]/20 text-sm text-[#6E94F5] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E94F5]" />
              Мы рядом
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Контакты
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Приходите к нам или запишитесь онлайн
            </p>
          </div>

          {/* Карточка контактов */}
          <div className="relative p-8 md:p-10 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50">

            <div className="space-y-6">

              {/* Адрес */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#6E94F5]/5 transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#6E94F5] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#6E94F5]/30">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-0.5">Адрес</p>
                  <p className="font-semibold text-slate-900">Ясная ул., 14, корп. 1, городской посёлок Янино-1</p>
                </div>
              </div>

              {/* Телефон */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#6E94F5]/5 transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#6E94F5] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#6E94F5]/30">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-0.5">Телефон</p>
                  <a href="tel:+79991234567" className="font-semibold text-slate-900 hover:text-[#6E94F5] transition-colors">
                    +7 (999) 123-45-67
                  </a>
                </div>
              </div>

              {/* Время работы */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#6E94F5]/5 transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#6E94F5] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#6E94F5]/30">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-0.5">Режим работы</p>
                  <p className="font-semibold text-slate-900">Пн–Сб: 9:00 – 20:00</p>
                </div>
              </div>
            </div>

            {/* Кнопка */}
            <button
              onClick={() => setShowAuth(true)}
              className="mt-8 w-full group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-[#6E94F5]" />
              <span className="absolute inset-0 bg-[#6E94F5] blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
              <span className="relative">
                Записаться на пробное занятие
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 pt-16 pb-10 border-t border-slate-200">
        <div className="container mx-auto px-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 mb-12">

            {/* Логотип + описание */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#6E94F5] flex items-center justify-center shadow-md shadow-[#6E94F5]/25">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900 text-lg">Дети на планете</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Развивающий центр для детей от 1 года. Творчество, наука и спорт в одном месте.
              </p>
            </div>

            {/* Информация */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-5">Информация</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <FileText className="w-4 h-4" />
                  Политика работы центра
                </a>
                <a href="#" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <Shield className="w-4 h-4" />
                  Политика конфиденциальности
                </a>
                <a href="#" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <FileText className="w-4 h-4" />
                  Условия использования
                </a>
              </div>
            </div>

            {/* Поддержка */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-5">Поддержка</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Написать в поддержку
                </a>
                <a href="#" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  Частые вопросы
                </a>
                <a href="tel:+79991234567" className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#6E94F5] transition-colors">
                  <Phone className="w-4 h-4" />
                  +7 (999) 123-45-67
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 Дети на планете. Все права защищены.
            </p>
            <p className="text-slate-500 text-sm">
              ул. Ясная, 14к2 · Пн–Сб 9:00–20:00
            </p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
    </div>
  );
};

export default LandingPage;
