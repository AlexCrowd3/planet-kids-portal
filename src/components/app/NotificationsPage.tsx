import { CalendarDays, Info, CreditCard, ArrowLeft } from "lucide-react";

interface NotificationsPageProps {
  onNavigate: (view: string) => void;
}

interface NotificationItem {
  icon: typeof CalendarDays;
  text: string;
  color: "orange" | "blue" | "red";
}

interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

const notificationGroups: NotificationGroup[] = [
  {
    label: "Сегодня",
    items: [
      {
        icon: CalendarDays,
        text: 'Сегодня Миша записан на занятие "Рисование" в 18:00',
        color: "orange",
      },
      {
        icon: CreditCard,
        text: "Ваша подписка премиум заканчивается, не забудьте продлить её не позднее 17.02.2026",
        color: "red",
      },
    ],
  },
  {
    label: "Вчера",
    items: [
      {
        icon: Info,
        text: "У нас новое направление! Посмотрите на главной!",
        color: "blue",
      },
    ],
  },
  {
    label: "Январь, 18",
    items: [
      {
        icon: Info,
        text: 'Спасибо за оформление подписки! Мы рады видеть вас в нашей семье "Дети на планете".',
        color: "blue",
      },
    ],
  },
  {
    label: "Январь, 10",
    items: [
      {
        icon: Info,
        text: "Спасибо что скачали приложение :) Здесь очень удобно, вот увидете!",
        color: "blue",
      },
    ],
  },
];

const NotificationsPage = ({ onNavigate }: NotificationsPageProps) => {
  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-primary-opacity">Уведомления</h1>
        </div>
        <button className="gradient-orange text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
          Очистить все
        </button>
      </div>

      <div className="space-y-5">
        {notificationGroups.map((group) => (
          <div key={group.label}>
            <h2 className="font-bold text-primary-opacity mb-3">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map((item, idx) => (
                <div key={idx} className={`notification-card ${item.color}`}>
                  <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
