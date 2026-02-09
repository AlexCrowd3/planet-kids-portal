import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import {
  ArrowLeft,
  Edit,
  User,
  ChevronDown,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Award,
} from "lucide-react";

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="animate-fade-in p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-primary-opacity">Профиль</h1>
        </div>
        <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
          <Edit className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - user info */}
        <div className="space-y-5">
          {/* User card */}
          <div className="glass-card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-primary-opacity">{user.name}</h2>
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <Mail className="w-4 h-4 text-primary" />
                <span>vladimir@example.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <Phone className="w-4 h-4 text-primary" />
                <span>+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <MapPin className="w-4 h-4 text-primary" />
                <span>г. Москва</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full bg-destructive/90 text-destructive-foreground py-3.5 rounded-2xl font-semibold text-center flex items-center justify-center gap-2 hover:bg-destructive transition-colors active:scale-[0.98]"
          >
            Выйти из аккаунта
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center column - subscription & points */}
        <div className="space-y-5">
          {/* Premium & Points */}
          <PremiumWidget compact onSubscribeClick={() => onNavigate("subscribe")} />

          <p className="text-center text-xs text-secondary-opacity">
            Подписку необходимо будет оплатить заранее!{"\n"}
            Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary-opacity">3</p>
              <p className="text-xs text-secondary-opacity">Занятий осталось</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Award className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary-opacity">{user.points}</p>
              <p className="text-xs text-secondary-opacity">Баллов</p>
            </div>
          </div>
        </div>

        {/* Right column - children */}
        <div className="space-y-5">
          <div>
            <h3 className="font-bold text-primary-opacity text-lg mb-3">Дети</h3>
            <div className="space-y-2">
              {user.children.map((child) => (
                <div
                  key={child}
                  className="glass-card px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-primary-opacity">{child}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add child button */}
          <button className="w-full glass-premium py-3.5 rounded-2xl font-semibold text-center flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            Добавить ребёнка
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
