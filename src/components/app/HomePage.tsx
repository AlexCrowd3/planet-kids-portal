import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import DirectionCard from "@/components/shared/DirectionCard";
import { Settings, X, CalendarDays, ChevronRight } from "lucide-react";
import { useState } from "react";

interface HomePageProps {
  onNavigate: (view: string) => void;
}

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
        <button
          onClick={() => onNavigate("settings")}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Premium Widget */}
          <PremiumWidget onSubscribeClick={() => onNavigate("subscribe")} />

          {/* Special Offers */}
          <div>
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Специальные предложения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DirectionCard
                name="Рисование"
                age="6+"
                description="Освойте основы композиции и поработайте с акварелью в лёгкой, воздушной технике. Урок подойдёт как для начинающих, так и для тех, кто уже имеет опыт."
                days={["ПН", "СР", "ПТ"]}
              />
              <DirectionCard
                name="Робототехника"
                age="7+"
                description="Спроектируйте и соберите собственного подвижного робота, освоив основы схемотехники и программирования на Arduino."
                days={["ПН", "СР", "ПТ"]}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Banner */}
          {showBanner && (
            <div className="gradient-primary rounded-2xl p-5 text-primary-foreground relative animate-scale-in">
              <button
                onClick={() => setShowBanner(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-lg mb-1">Запишись на занятие уже сейчас!</h3>
              <p className="text-sm text-white/80 mb-3">
                Сегодня в нашем центре пройдёт незабываемое занятие по квиллингу, вы сможете посетить его и получить новые знания.
              </p>
              <button className="bg-background text-primary-opacity px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 hover:shadow-soft transition-all">
                Узнать подробнее <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Notifications */}
          <div>
            <h2 className="font-bold text-primary-opacity text-lg mb-3">Уведомления</h2>
            <div className="notification-card orange">
              <CalendarDays className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Сегодня Миша записан на занятие "Рисование" в 18:00
              </p>
            </div>
          </div>

          {/* View All */}
          <button
            onClick={() => onNavigate("notifications")}
            className="w-full text-center text-secondary-opacity text-sm font-medium py-2 hover:text-primary transition-colors"
          >
            Посмотреть все
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
