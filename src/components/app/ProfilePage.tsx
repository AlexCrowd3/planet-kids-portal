import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import {
  ArrowLeft,
  Edit,
  User,
  ChevronDown,
  LogOut,
  Trash2,
  UserPlus,
} from "lucide-react";

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Header area with gradient */}
      <div className="relative">
        <div className="h-32 gradient-primary opacity-30 rounded-b-3xl" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-secondary-opacity hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Профиль</span>
          </button>
          <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center -mt-16 relative z-10">
          <div className="w-28 h-28 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-5xl shadow-soft">
            👤
          </div>
          <h2 className="text-xl font-bold text-primary-opacity mt-3">{user.name}</h2>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Premium & Points */}
        <PremiumWidget compact onSubscribeClick={() => onNavigate("subscribe")} />

        <p className="text-center text-xs text-secondary-opacity">
          Подписку необходимо будет оплатить заранее!{"\n"}
          Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
        </p>

        {/* Children */}
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

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full bg-destructive/90 text-destructive-foreground py-3.5 rounded-2xl font-semibold text-center flex items-center justify-center gap-2 hover:bg-destructive transition-colors active:scale-[0.98]"
        >
          Выйти из аккаунта
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
