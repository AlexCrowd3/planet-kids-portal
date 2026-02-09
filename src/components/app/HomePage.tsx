import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import DirectionCard from "@/components/shared/DirectionCard";
import { Settings, X, CalendarDays, ChevronRight, TrendingUp, BookOpen, Users, Award, CreditCard, Info } from "lucide-react";
import { useState } from "react";

interface HomePageProps {
  onNavigate: (view: string) => void;
}

const notifications = [
  { text: 'Сегодня Миша записан на занятие "Рисование" в 18:00', color: "orange" as const, icon: CalendarDays },
  { text: "Ваша подписка Premium+ заканчивается 17.02.2026", color: "red" as const, icon: CreditCard },
  { text: "У нас новое направление! Посмотрите в разделе «Направления»", color: "blue" as const, icon: Info },
];

const HomePage = ({ onNavigate }: HomePageProps) => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(true);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";
    return "Добрый вечер";
  })();

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-secondary-opacity text-sm">{greeting},</p>
            <p className="font-bold text-primary text-lg">{user.firstName}</p>
          </div>
        </div>
        <button onClick={() => onNavigate("settings")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop: multi-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Premium Widget */}
          <PremiumWidget onSubscribeClick={() => onNavigate("subscribe")} />

          {/* Stats row - desktop only */}
          <div className="hidden lg:grid grid-cols-3 gap-3">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-opacity">3</p>
                <p className="text-xs text-secondary-opacity">Занятий осталось</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
                <Award className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-opacity">{user.points}</p>
                <p className="text-xs text-secondary-opacity">Баллов</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-opacity">12</p>
                <p className="text-xs text-secondary-opacity">Занятий за месяц</p>
              </div>
            </div>
          </div>

          {/* Special Offers */}
          <div>
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Специальные предложения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DirectionCard name="Рисование" age="6+" description="Освойте основы композиции и поработайте с акварелью в лёгкой, воздушной технике." days={["ПН", "СР", "ПТ"]} />
              <DirectionCard name="Робототехника" age="7+" description="Спроектируйте и соберите собственного подвижного робота на Arduino." days={["ПН", "СР", "ПТ"]} />
            </div>
          </div>

          {/* Upcoming classes - desktop only */}
          <div className="hidden lg:block">
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Ближайшие занятия</h2>
            <div className="space-y-2">
              {[
                { name: "Рисование", time: "Сегодня, 16:00", child: "Даня" },
                { name: "Робототехника", time: "Сегодня, 17:00", child: "Вика" },
                { name: "Шахматы", time: "Завтра, 15:00", child: "Даня" },
              ].map((cls, idx) => (
                <div key={idx} className="glass-card px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary-opacity text-sm">{cls.name}</p>
                      <p className="text-xs text-secondary-opacity">{cls.child}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">{cls.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Children widget - desktop only */}
          <div className="hidden lg:block">
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Ваши дети</h2>
            <div className="flex gap-3">
              {user.children.map((child) => (
                <div key={child} className="glass-card px-5 py-4 flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-opacity">{child}</p>
                    <p className="text-xs text-secondary-opacity">3 занятия на этой неделе</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Banner */}
          {showBanner && (
            <div className="gradient-primary rounded-2xl p-5 text-primary-foreground relative animate-scale-in">
              <button onClick={() => setShowBanner(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-lg mb-1">Запишись на занятие!</h3>
              <p className="text-sm text-white/80 mb-3">Сегодня пройдёт незабываемое занятие по квиллингу.</p>
              <button className="bg-background text-primary-opacity px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 hover:shadow-soft transition-all">
                Узнать подробнее <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Notifications - 3 on desktop, 1 on mobile */}
          <div>
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Уведомления</h2>
            <div className="space-y-2">
              {/* Mobile: 1, Desktop: 3 */}
              {notifications.slice(0, 1).map((n, idx) => (
                <div key={idx} className={`notification-card ${n.color} lg:hidden`}>
                  <n.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{n.text}</p>
                </div>
              ))}
              {notifications.map((n, idx) => (
                <div key={`d-${idx}`} className={`notification-card ${n.color} hidden lg:flex`}>
                  <n.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => onNavigate("notifications")} className="w-full text-center text-secondary-opacity text-sm font-medium py-2 hover:text-primary transition-colors">
            Посмотреть все
          </button>

          {/* Quick actions - desktop only */}
          <div className="hidden lg:block space-y-2">
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Быстрые действия</h2>
            <button onClick={() => onNavigate("calendar")} className="w-full glass-card px-4 py-3 flex items-center gap-3 hover:shadow-elevated transition-all">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary-opacity text-sm">Открыть календарь</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
            <button onClick={() => onNavigate("directions")} className="w-full glass-card px-4 py-3 flex items-center gap-3 hover:shadow-elevated transition-all">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary-opacity text-sm">Все направления</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
            <button onClick={() => onNavigate("profile")} className="w-full glass-card px-4 py-3 flex items-center gap-3 hover:shadow-elevated transition-all">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary-opacity text-sm">Профиль</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
