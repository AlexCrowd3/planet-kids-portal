import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/landing/AuthModal";
import heroImage from "@/assets/hero-children.jpg";
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
  Sparkles,
} from "lucide-react";

const directions = [
  { icon: Palette, name: "Рисование", age: "6+", desc: "Акварель, графика, композиция" },
  { icon: Cpu, name: "Робототехника", age: "7+", desc: "Arduino, конструирование, программирование" },
  { icon: Drama, name: "Театр", age: "1+", desc: "Актёрское мастерство, постановки" },
  { icon: Brain, name: "Шахматы", age: "4+", desc: "Стратегическое мышление" },
  { icon: Music, name: "Музыка", age: "3+", desc: "Вокал, ритмика, музыкальные инструменты" },
  { icon: Sparkles, name: "Пластилинография", age: "3+", desc: "Лепка, моторика, творчество" },
];

const reviews = [
  { name: "Анна М.", text: "Прекрасный центр! Дочка с удовольствием ходит на рисование уже полгода. Педагоги — настоящие профессионалы.", rating: 5 },
  { name: "Игорь К.", text: "Записали сына на робототехнику — в восторге! Каждый раз бежит на занятия. Спасибо команде!", rating: 5 },
  { name: "Мария Д.", text: "Уютная атмосфера, современные методики. Обе дочери занимаются с удовольствием. Рекомендую!", rating: 5 },
];

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { login } = useAuth();

  const handleLogin = () => {
    login();
    setShowAuth(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-primary-opacity">Дети на планете</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#directions"
              className="hidden sm:inline text-sm font-medium text-secondary-opacity hover:text-primary transition-colors"
            >
              Направления
            </a>
            <a
              href="#schedule"
              className="hidden sm:inline text-sm font-medium text-secondary-opacity hover:text-primary transition-colors"
            >
              Расписание
            </a>
            <button
              onClick={() => setShowAuth(true)}
              className="gradient-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-elevated active:scale-95"
            >
              Войти
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 overflow-hidden">
        <div className="relative h-[70vh] min-h-[500px]">
          <img
            src={heroImage}
            alt="Дети на занятиях в центре «Дети на планете»"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-opacity mb-4 animate-fade-in max-w-2xl">
                Дети на планете
              </h1>

              {/* Liquid Glass info card */}
              <div className="glass-card p-5 max-w-md mb-6 animate-fade-in-up">
                <p className="font-semibold text-primary-opacity mb-1">Развивающий центр для детей от 1 года</p>
                <p className="text-sm text-secondary-opacity mb-3">
                  Творчество, наука и спорт — всё в одном месте. Более 10 направлений, опытные педагоги и уютная атмосфера.
                </p>
                <div className="flex items-center gap-4 text-xs text-secondary-opacity">
                  <span className="flex items-center gap-1">📍 Ясная 14к2</span>
                  <span className="flex items-center gap-1">🕐 Пн–Сб 9–20</span>
                </div>
              </div>

              <button
                onClick={() => setShowAuth(true)}
                className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-95 animate-fade-in-up flex items-center gap-2"
              >
                Записаться <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-opacity mb-6">
            Почему выбирают нас?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: "🎨", title: "10+ направлений", desc: "От робототехники до театра" },
              { emoji: "👨‍🏫", title: "Опытные педагоги", desc: "Профессионалы с любовью к детям" },
              { emoji: "🏠", title: "Уютное пространство", desc: "Современный ремонт и оборудование" },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6 hover:shadow-elevated transition-all">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-primary-opacity mb-2">{item.title}</h3>
                <p className="text-secondary-opacity text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directions */}
      <section id="directions" className="py-16 px-4 bg-secondary/50 scroll-mt-20">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-opacity mb-8 text-center">
            Наши направления
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {directions.map((dir) => (
              <div
                key={dir.name}
                className="glass-card p-5 flex items-start gap-4 hover:shadow-elevated transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <dir.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-primary-opacity">{dir.name}</h3>
                    <span className="text-xs font-semibold text-primary">{dir.age}</span>
                  </div>
                  <p className="text-secondary-opacity text-sm">{dir.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="py-16 px-4 scroll-mt-20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-opacity mb-6">
            Расписание занятий
          </h2>
          <div className="space-y-3 max-w-md mx-auto">
            {[
              { name: "Рисование", age: "6+", time: "Пн, Ср, Пт — 16:00" },
              { name: "Робототехника", age: "7+", time: "Пн, Вт — 17:00" },
              { name: "Театр", age: "1+", time: "Вт, Чт — 19:00" },
              { name: "Шахматы", age: "4+", time: "Ср, Пт — 17:00" },
              { name: "Музыка", age: "3+", time: "Пн, Пт — 15:00" },
            ].map((item) => (
              <div key={item.name} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary-opacity">{item.name}</span>
                  <span className="text-xs font-semibold text-primary">{item.age}</span>
                </div>
                <span className="text-sm text-secondary-opacity">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-opacity mb-8 text-center">
            Отзывы родителей
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div key={review.name} className="glass-card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-notification-warning text-notification-warning" />
                  ))}
                </div>
                <p className="text-secondary-opacity text-sm mb-4 leading-relaxed">
                  «{review.text}»
                </p>
                <p className="font-semibold text-primary-opacity text-sm">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-opacity mb-8">
            Контакты
          </h2>
          <div className="glass-card p-8 space-y-4">
            <div className="flex items-center justify-center gap-3 text-primary-opacity">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-medium">ул. Ясная, 14к2</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary-opacity">
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">+7 (999) 123-45-67</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary-opacity">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Пн–Сб: 9:00 – 20:00</span>
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="mt-4 gradient-primary text-primary-foreground px-8 py-3 rounded-full font-semibold shadow-elevated hover:shadow-lg transition-all active:scale-95"
            >
              Записаться на пробное занятие
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-secondary-opacity text-sm">
        <p>© 2026 Дети на планете. Все права защищены.</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
    </div>
  );
};

export default LandingPage;
