import { useEffect, useState } from "react";
import {
  CalendarDays,
  Home,
  LogOut,
  UserRound,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TeacherHome from "@/components/teacher/TeacherHome";
import TeacherSchedule from "@/components/teacher/TeacherSchedule";
import TeacherBalance from "@/components/teacher/TeacherBalance";
import TeacherProfile from "@/components/teacher/TeacherProfile";

export type TeacherSession = {
  id: string;
  firstName: string;
  lastName: string | null;
  role: string;
};

export type TeacherTab = "home" | "schedule" | "balance" | "profile";

const TeacherApp = () => {
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState<TeacherSession | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>("home");

  useEffect(() => {
    const stored = localStorage.getItem("teacher_session");

    if (!stored) {
      navigate("/teacher", { replace: true });
      return;
    }

    try {
      const session = JSON.parse(stored) as TeacherSession;

      if (!session.id || session.role !== "teacher") {
        localStorage.removeItem("teacher_session");
        navigate("/teacher", { replace: true });
        return;
      }

      setTeacher(session);
    } catch {
      localStorage.removeItem("teacher_session");
      navigate("/teacher", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("teacher_session");
    navigate("/teacher", { replace: true });
  };

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-secondary-opacity">Загрузка...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <TeacherHome teacher={teacher} />;
      case "schedule":
        return <TeacherSchedule teacher={teacher} />;
      case "balance":
        return <TeacherBalance teacher={teacher} />;
      case "profile":
        return <TeacherProfile teacher={teacher} onLogout={logout} />;
      default:
        return <TeacherHome teacher={teacher} />;
    }
  };

  const tabs = [
    {
      id: "home" as TeacherTab,
      label: "Главная",
      icon: Home,
    },
    {
      id: "schedule" as TeacherTab,
      label: "Расписание",
      icon: CalendarDays,
    },
    {
      id: "balance" as TeacherTab,
      label: "Баланс",
      icon: Wallet,
    },
    {
      id: "profile" as TeacherTab,
      label: "Профиль",
      icon: UserRound,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Дети на планете
            </p>
            <p className="text-xs text-secondary-opacity">
              Кабинет учителя
            </p>
          </div>

          <button
            onClick={logout}
            className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-secondary-opacity transition hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-24">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-4 px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs transition-all ${active ? "text-primary" : "text-secondary-opacity hover:text-foreground"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${active ? "gradient-primary text-primary-foreground" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={active ? "font-semibold" : ""}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default TeacherApp;