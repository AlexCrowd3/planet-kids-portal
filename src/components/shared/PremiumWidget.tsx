import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Clock, Info, Award } from "lucide-react";

interface PremiumWidgetProps {
  compact?: boolean;
  onSubscribeClick?: () => void;
}

const PremiumWidget = ({ compact = false, onSubscribeClick }: PremiumWidgetProps) => {
  const { user } = useAuth();

  if (compact) {
    return (
      <div className="flex gap-3">
        <div
          className="glass-premium px-5 py-3 flex-1 cursor-pointer hover:shadow-elevated transition-all"
          onClick={onSubscribeClick}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5" />
            <span className="font-bold">Premium+</span>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Активна до {user.subscriptionDate}</span>
          </div>
        </div>
        <div className="gradient-orange rounded-2xl px-5 py-3 flex-1 text-primary-foreground">
          <p className="text-xs text-white/80">Вам доступно:</p>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{user.points}</span>
            <span className="text-sm">баллов</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-premium p-5 cursor-pointer hover:shadow-elevated transition-all"
      onClick={onSubscribeClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          <span className="font-bold text-lg">Premium+</span>
        </div>
        <span className="text-sm font-semibold text-yellow-300">Активно</span>
      </div>
      <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
        <Info className="w-4 h-4" />
        <span>Подписка премиум позволяет посещать все занятия нашего центра.</span>
      </div>
      <div className="flex items-center gap-1 text-white/80 text-sm mt-2">
        <Clock className="w-4 h-4" />
        <span>Активна до {user.subscriptionDate}</span>
      </div>
    </div>
  );
};

export default PremiumWidget;
