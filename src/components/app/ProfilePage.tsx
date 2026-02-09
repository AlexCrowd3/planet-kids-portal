import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import {
  ArrowLeft, Edit, User, ChevronDown, Trash2, UserPlus, Mail, Phone, MapPin,
  CreditCard, Award, X, Check, Save, CalendarDays, TrendingUp, BookOpen,
} from "lucide-react";

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { user, logout } = useAuth();

  const [editProfile, setEditProfile] = useState(false);
  const [editChildIdx, setEditChildIdx] = useState<number | null>(null);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: "vladimir@example.com",
    phone: "+7 (999) 123-45-67",
    city: "г. Москва",
  });
  const [childrenData, setChildrenData] = useState(
    user.children.map((c) => ({ name: c, age: "7", notes: "" }))
  );
  const [newChildName, setNewChildName] = useState("");
  const [showAddChild, setShowAddChild] = useState(false);
  const [expandedChild, setExpandedChild] = useState<number | null>(null);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const handleSaveProfile = () => setEditProfile(false);
  const handleSaveChild = () => setEditChildIdx(null);
  const handleAddChild = () => {
    if (newChildName.trim()) {
      setChildrenData([...childrenData, { name: newChildName, age: "", notes: "" }]);
      setNewChildName("");
      setShowAddChild(false);
    }
  };
  const removeChild = (idx: number) => setChildrenData(childrenData.filter((_, i) => i !== idx));

  return (
    <div className="animate-fade-in p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate("home")} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-primary-opacity">Профиль</h1>
        </div>
        <button onClick={() => setEditProfile(true)} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
          <Edit className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - user info */}
        <div className="space-y-5">
          <div className="glass-card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-primary-opacity">{profileData.name}</h2>
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <Mail className="w-4 h-4 text-primary" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <Phone className="w-4 h-4 text-primary" />
                <span>{profileData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{profileData.city}</span>
              </div>
            </div>
          </div>

          {/* Activity stats */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-primary-opacity mb-3">Активность</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                  <CalendarDays className="w-4 h-4 text-primary" /> Занятий посещено
                </div>
                <span className="font-bold text-primary-opacity">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                  <TrendingUp className="w-4 h-4 text-primary" /> За этот месяц
                </div>
                <span className="font-bold text-primary-opacity">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                  <BookOpen className="w-4 h-4 text-primary" /> Направлений
                </div>
                <span className="font-bold text-primary-opacity">3</span>
              </div>
            </div>
          </div>

          <button onClick={logout} className="w-full bg-destructive/90 text-destructive-foreground py-3.5 rounded-2xl font-semibold text-center flex items-center justify-center gap-2 hover:bg-destructive transition-colors active:scale-[0.98]">
            Выйти из аккаунта <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center column - subscription & points */}
        <div className="space-y-5">
          <PremiumWidget compact onSubscribeClick={() => onNavigate("subscribe")} />
          <p className="text-center text-xs text-secondary-opacity">
            Подписку необходимо будет оплатить заранее! Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
          </p>
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

          {/* Points info */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-primary mb-3">Зачем нужны баллы?</h3>
            <div className="space-y-1 text-sm text-secondary-opacity">
              <p>100 баллов — дополнительное занятие</p>
              <p>250 баллов — мастер-класс в подарок</p>
              <p>500 баллов — игрушка на выбор</p>
            </div>
          </div>
        </div>

        {/* Right column - children */}
        <div className="space-y-5">
          <div>
            <h3 className="font-bold text-primary-opacity text-lg mb-3">Дети</h3>
            <div className="space-y-2">
              {childrenData.map((child, idx) => (
                <div key={idx}>
                  <div className="glass-card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-primary-opacity">{child.name}</span>
                        {child.age && <p className="text-xs text-secondary-opacity">{child.age} лет</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditChildIdx(idx)} className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedChild(expandedChild === idx ? null : idx)} className="text-muted-foreground">
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedChild === idx ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  {expandedChild === idx && (
                    <div className="glass-card px-4 py-3 mt-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-opacity">Занятий на этой неделе</span>
                        <span className="font-bold text-primary-opacity">3</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-opacity">Направления</span>
                        <span className="font-bold text-primary-opacity">Рисование, Шахматы</span>
                      </div>
                      <button onClick={() => removeChild(idx)} className="text-xs text-destructive hover:underline">Удалить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setShowAddChild(true)} className="w-full glass-premium py-3.5 rounded-2xl font-semibold text-center flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> Добавить ребёнка
          </button>

          {/* Favourite directions */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-primary-opacity mb-3">Любимые направления</h3>
            <div className="space-y-2">
              {["Рисование", "Робототехника", "Шахматы"].map((dir) => (
                <div key={dir} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-primary-opacity">{dir}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setEditProfile(false)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl p-6 shadow-elevated animate-scale-in">
            <button onClick={() => setEditProfile(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            <h2 className="text-xl font-bold text-primary-opacity mb-5">Редактировать профиль</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Имя</label><input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Email</label><input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Телефон</label><input value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Город</label><input value={profileData.city} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} className={inputClass} /></div>
            </div>
            <button onClick={handleSaveProfile} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold mt-5 flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {editChildIdx !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setEditChildIdx(null)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl p-6 shadow-elevated animate-scale-in">
            <button onClick={() => setEditChildIdx(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            <h2 className="text-xl font-bold text-primary-opacity mb-5">Редактировать данные ребёнка</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Имя</label><input value={childrenData[editChildIdx]?.name || ""} onChange={(e) => { const upd = [...childrenData]; upd[editChildIdx] = { ...upd[editChildIdx], name: e.target.value }; setChildrenData(upd); }} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Возраст</label><input value={childrenData[editChildIdx]?.age || ""} onChange={(e) => { const upd = [...childrenData]; upd[editChildIdx] = { ...upd[editChildIdx], age: e.target.value }; setChildrenData(upd); }} className={inputClass} placeholder="Лет" /></div>
              <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Заметки</label><textarea value={childrenData[editChildIdx]?.notes || ""} onChange={(e) => { const upd = [...childrenData]; upd[editChildIdx] = { ...upd[editChildIdx], notes: e.target.value }; setChildrenData(upd); }} className={`${inputClass} resize-none h-20`} placeholder="Аллергии, особенности..." /></div>
            </div>
            <button onClick={handleSaveChild} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold mt-5 flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowAddChild(false)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl p-6 shadow-elevated animate-scale-in">
            <button onClick={() => setShowAddChild(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            <h2 className="text-xl font-bold text-primary-opacity mb-5">Добавить ребёнка</h2>
            <div><label className="block text-sm font-medium text-secondary-opacity mb-1">Имя ребёнка</label><input value={newChildName} onChange={(e) => setNewChildName(e.target.value)} className={inputClass} placeholder="Введите имя" /></div>
            <button onClick={handleAddChild} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold mt-5 flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" /> Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
