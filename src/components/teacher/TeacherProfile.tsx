import { LogOut, UserRound } from "lucide-react";
import type { TeacherSession } from "@/pages/TeacherApp";

type Props = {
  teacher: TeacherSession;
  onLogout: () => void;
};

const TeacherProfile = ({ teacher, onLogout }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Профиль
        </h1>

        <p className="mt-1 text-sm text-secondary-opacity">
          Ваши данные
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <UserRound className="h-8 w-8 text-primary-foreground" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">
              {teacher.firstName} {teacher.lastName}
            </h2>

            <p className="mt-1 text-sm text-secondary-opacity">
              Учитель
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div>
            <p className="text-xs text-secondary-opacity">
              Имя
            </p>

            <p className="mt-1 font-medium text-foreground">
              {teacher.firstName}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-secondary-opacity">
              Фамилия
            </p>

            <p className="mt-1 font-medium text-foreground">
              {teacher.lastName || "—"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-destructive transition hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Выйти из аккаунта
      </button>
    </div>
  );
};

export default TeacherProfile;