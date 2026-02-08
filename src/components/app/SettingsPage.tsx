import {
  ArrowLeft,
  Star,
  MessageCircle,
  ExternalLink,
  CreditCard,
} from "lucide-react";

interface SettingsPageProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

const SettingsPage = ({ onBack, onNavigate }: SettingsPageProps) => {
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-primary-opacity">Настройки</h1>
      </div>

      {/* Главное */}
      <div>
        <h2 className="font-bold text-primary-opacity mb-3">Главное</h2>
        <div className="space-y-2">
          <div className="glass-card px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-elevated transition-all">
            <span className="font-medium text-primary-opacity">Оставить отзыв</span>
            <span className="gradient-orange text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
              +25 баллов
            </span>
          </div>
          <div className="glass-card px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-elevated transition-all">
            <span className="font-medium text-primary-opacity">Написать в поддержку</span>
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Конфиденциальность */}
      <div>
        <h2 className="font-bold text-primary-opacity mb-3">Конфиденциальность</h2>
        <div className="space-y-2">
          <div className="glass-card px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-elevated transition-all">
            <span className="font-medium text-primary-opacity">Политика работы центра</span>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="glass-card px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-elevated transition-all">
            <span className="font-medium text-primary-opacity">Условия использования</span>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Персональное */}
      <div>
        <h2 className="font-bold text-primary-opacity mb-3">Персональное</h2>
        <button
          onClick={() => onNavigate("subscribe")}
          className="w-full glass-premium px-5 py-4 flex items-center justify-between hover:shadow-elevated transition-all"
        >
          <span className="font-semibold">Подобрать подписку</span>
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
