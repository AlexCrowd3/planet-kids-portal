import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

const TeacherLogin = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    const fullName = name.trim();

    if (!fullName) {
      setError("Введите имя и фамилию");
      return;
    }

    if (!password) {
      setError("Введите пароль");
      return;
    }

    const parts = fullName.split(/\s+/);

    if (parts.length < 2) {
      setError("Введите имя и фамилию");
      return;
    }

    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    setLoading(true);

    try {
      const { data: teacher, error: teacherError } = await supabase
        .from("users")
        .select("id, first_name, last_name, password_hash, role, is_active")
        .eq("role", "teacher")
        .ilike("first_name", firstName)
        .ilike("last_name", lastName)
        .maybeSingle();

      if (teacherError) {
        console.error("Teacher login error:", teacherError);
        setError("Не удалось выполнить вход");
        return;
      }

      if (!teacher) {
        setError("Учитель с таким именем не найден");
        return;
      }

      if (!teacher.is_active) {
        setError("Ваш аккаунт деактивирован");
        return;
      }

      if (!teacher.password_hash) {
        setError("Для аккаунта не установлен пароль");
        return;
      }

      const passwordValid = await bcrypt.compare(
        password,
        teacher.password_hash
      );

      if (!passwordValid) {
        setError("Неверный пароль");
        return;
      }

      localStorage.setItem(
        "teacher_session",
        JSON.stringify({
          id: teacher.id,
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          role: teacher.role,
        })
      );

      navigate("/teacher/app", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
              <UserRound className="h-7 w-7 text-primary-foreground" />
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              Кабинет учителя
            </h1>

            <p className="mt-2 text-sm text-secondary-opacity">
              Введите имя, фамилию и пароль
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Имя и фамилия
              </label>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-opacity" />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  autoComplete="username"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Пароль
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-opacity" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-secondary-opacity transition hover:bg-secondary hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl gradient-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-secondary-opacity">
          Дети на планете
        </p>
      </div>
    </div>
  );
};

export default TeacherLogin;