import {
  CalendarDays,
  Info,
  CreditCard,
  ArrowLeft,
  Bell,
  Trash2,
} from "lucide-react";

interface NotificationsPageProps {
  onNavigate: (view: string) => void;
}

interface NotificationItem {
  id: number;
  icon: typeof CalendarDays;
  text: string;
  color: "orange" | "blue" | "red";
  time?: string;
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
        id: 1,
        icon: CalendarDays,
        text: 'Сегодня Миша записан на занятие «Рисование» в 18:00',
        color: "orange",
        time: "10:24",
      },
      {
        id: 2,
        icon: CreditCard,
        text: "Ваша подписка Премиум заканчивается. Не забудьте продлить её, чтобы продолжить пользоваться всеми возможностями.",
        color: "red",
        time: "09:15",
      },
    ],
  },
  {
    label: "Вчера",
    items: [
      {
        id: 3,
        icon: Info,
        text: "У нас новое направление! Посмотрите его на главной странице.",
        color: "blue",
        time: "18:42",
      },
    ],
  },
  {
    label: "18 января",
    items: [
      {
        id: 4,
        icon: Info,
        text: "Спасибо за оформление подписки! Мы рады видеть вас в нашей семье «Дети на планете».",
        color: "blue",
        time: "14:20",
      },
    ],
  },
  {
    label: "10 января",
    items: [
      {
        id: 5,
        icon: Info,
        text: "Спасибо, что присоединились к «Детям на планете» :) Здесь вас ждёт много интересного!",
        color: "blue",
        time: "11:05",
      },
    ],
  },
];

const colorStyles = {
  orange: {
    wrapper: "bg-orange-50 border-orange-100",
    icon: "bg-orange-100 text-orange-500",
  },
  blue: {
    wrapper: "bg-blue-50 border-blue-100",
    icon: "bg-blue-100 text-blue-500",
  },
  red: {
    wrapper: "bg-red-50 border-red-100",
    icon: "bg-red-100 text-red-500",
  },
};

const NotificationsPage = ({ onNavigate }: NotificationsPageProps) => {
  const hasNotifications = notificationGroups.some(
    (group) => group.items.length > 0
  );

  return (
    <div className="animate-fade-in px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("home")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:bg-secondary/80 hover:text-foreground"
              aria-label="Назад"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-primary-opacity md:text-3xl">
                  Уведомления
                </h1>

                <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                  5
                </div>
              </div>

              <p className="mt-1 text-sm text-secondary-opacity">
                Здесь будут отображаться важные события и напоминания
              </p>
            </div>
          </div>

          {hasNotifications && (
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-secondary-opacity transition-all hover:bg-secondary hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
              <span>Очистить все</span>
            </button>
          )}
        </div>

        {!hasNotifications ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="h-7 w-7 text-secondary-opacity" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-primary-opacity">
              Пока нет уведомлений
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-secondary-opacity">
              Здесь появятся напоминания о занятиях, подписках и другие важные
              сообщения.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {notificationGroups.map((group) => (
              <section key={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-bold text-primary-opacity">
                    {group.label}
                  </h2>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const styles = colorStyles[item.color];

                    return (
                      <div
                        key={item.id}
                        className={`group flex items-start gap-4 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${styles.wrapper}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-6 text-primary-opacity">
                            {item.text}
                          </p>

                          {item.time && (
                            <p className="mt-1.5 text-xs text-secondary-opacity">
                              {item.time}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;