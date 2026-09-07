import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  Activity,
  GraduationCap,
  BookOpen,
  WalletCards,
  CalendarDays
} from "lucide-react";

const nav = [
  {
    label: "Дашборд",
    to: "",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Расписание",
    to: "schedule",
    icon: CalendarDays,
  },
  {
    label: "Пользователи",
    to: "users",
    icon: Users,
  },
  {
    label: "Направления",
    to: "directions",
    icon: BookOpen,
  },
  {
    label: "Типы подписок",
    to: "subscriptions",
    icon: WalletCards,
  },
  {
    label: "Учителя",
    to: "teachers",
    icon: GraduationCap,
  },
  {
    label: "Платежи",
    to: "payments",
    icon: CreditCard,
  },
  {
    label: "Уведомления",
    to: "notifications",
    icon: Bell,
  },
  {
    label: "Отладка",
    to: "debug",
    icon: Activity,
  },
];

const AdminSidebar = () => {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-8 px-3 pt-2">
        <span className="text-lg font-bold tracking-tight text-[#646cff]">
          Админ панель
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {nav.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-[#646cff] text-white shadow-[0_6px_20px_rgba(100,108,255,0.22)]"
                  : "text-slate-500 hover:bg-[#646cff]/5 hover:text-[#646cff]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">
            Дети на планете
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Панель управления
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;