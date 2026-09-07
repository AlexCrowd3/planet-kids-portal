import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  first_name: string;
  last_name: string | null;
  password_hash: string | null;
  password_plain: string | null;
  is_active: boolean;
  created_at: string;
  teacher_profiles?: {
    balance: number;
    payout_day_1: number | null;
    payout_day_2: number | null;
  } | null;
};

export default function TeachersPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID учителя, у которого показываем пароль
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(
    null
  );

  const loadTeachers = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        password_hash,
        password_plain,
        is_active,
        created_at,
        teacher_profiles (
          balance,
          payout_day_1,
          payout_day_2
        )
      `)
      .eq("role", "teacher")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTeachers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // =========================
  // ДОБАВЛЕНИЕ УЧИТЕЛЯ
  // =========================

  const handleAdd = async () => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const password = form.password;

    if (!firstName) {
      setError("Введите имя");
      return;
    }

    if (!lastName) {
      setError("Введите фамилию");
      return;
    }

    if (!password) {
      setError("Введите пароль");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Хеш для проверки пароля при авторизации
      const passwordHash = await bcrypt.hash(password, 10);

      // Создаём пользователя
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          first_name: firstName,
          last_name: lastName,

          // Безопасный хеш
          password_hash: passwordHash,

          // Исходный пароль для отображения администратору
          password_plain: password,

          phone: null,
          role: "teacher",
          is_active: true,
          is_phone_verified: false,
        })
        .select()
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      // Создаём профиль учителя
      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .insert({
          teacher_id: user.id,
          balance: 0,
        });

      if (profileError) {
        // Если профиль не создался,
        // удаляем созданного учителя
        await supabase
          .from("users")
          .delete()
          .eq("id", user.id);

        throw new Error(profileError.message);
      }

      // Очищаем форму
      setForm({
        first_name: "",
        last_name: "",
        password: "",
      });

      await loadTeachers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось добавить учителя"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // АКТИВИРОВАТЬ / ВЫКЛЮЧИТЬ
  // =========================

  const handleToggleActive = async (
    id: string,
    current: boolean
  ) => {
    setError(null);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: !current,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadTeachers();
  };

  // =========================
  // УДАЛЕНИЕ
  // =========================

  const handleDelete = async (teacher: Teacher) => {
    const fullName = `${teacher.first_name} ${
      teacher.last_name || ""
    }`.trim();

    const confirmed = window.confirm(
      `Удалить учителя ${fullName}?\n\nБудут удалены его расписания, занятия, выплаты и профиль. Это действие нельзя отменить.`
    );

    if (!confirmed) return;

    setError(null);

    try {
      const { error: deleteError } = await supabase.rpc(
        "delete_teacher",
        {
          teacher_uuid: teacher.id,
        }
      );

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Если удаляемого учителя пароль был открыт,
      // закрываем его
      if (visiblePasswordId === teacher.id) {
        setVisiblePasswordId(null);
      }

      await loadTeachers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось удалить учителя"
      );
    }
  };

  // =========================
  // ПОКАЗАТЬ / СКРЫТЬ ПАРОЛЬ
  // =========================

  const togglePassword = (teacherId: string) => {
    setVisiblePasswordId((current) =>
      current === teacherId ? null : teacherId
    );
  };

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Учителя
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Управление учителями и доступом в личный кабинет
        </p>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* ФОРМА ДОБАВЛЕНИЯ */}
      {/* ========================= */}

      <div className="mb-6 rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">
          Добавить учителя
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Имя */}
          <input
            placeholder="Имя *"
            className="rounded-lg border px-4 py-2 outline-none transition focus:border-[#6E94F5]"
            value={form.first_name}
            onChange={(e) =>
              setForm({
                ...form,
                first_name: e.target.value,
              })
            }
          />

          {/* Фамилия */}
          <input
            placeholder="Фамилия *"
            className="rounded-lg border px-4 py-2 outline-none transition focus:border-[#6E94F5]"
            value={form.last_name}
            onChange={(e) =>
              setForm({
                ...form,
                last_name: e.target.value,
              })
            }
          />

          {/* Пароль */}
          <input
            type="text"
            placeholder="Пароль *"
            className="rounded-lg border px-4 py-2 outline-none transition focus:border-[#6E94F5]"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd();
              }
            }}
          />
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Пароль должен содержать минимум 6 символов
        </div>

        <button
          className="mt-4 rounded-lg bg-[#6E94F5] px-4 py-2 font-medium text-white transition hover:bg-[#5A82E0] disabled:opacity-50"
          onClick={handleAdd}
          disabled={saving}
        >
          {saving
            ? "Сохраняем..."
            : "Добавить учителя"}
        </button>
      </div>

      {/* ========================= */}
      {/* СПИСОК УЧИТЕЛЕЙ */}
      {/* ========================= */}

      {loading ? (
        <div className="opacity-60">
          Загрузка...
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-slate-500">
          Учителей пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((teacher) => {
            const profile = Array.isArray(
              teacher.teacher_profiles
            )
              ? teacher.teacher_profiles[0]
              : teacher.teacher_profiles;

            const isPasswordVisible =
              visiblePasswordId === teacher.id;

            return (
              <div
                key={teacher.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                {/* Информация */}
                <div>
                  <div className="font-medium">
                    {teacher.first_name}{" "}
                    {teacher.last_name || ""}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Вход по паролю
                  </div>

                  {/* ПАРОЛЬ */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      Пароль:
                    </span>

                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm text-slate-700">
                      {isPasswordVisible
                        ? teacher.password_plain || "Не указан"
                        : "••••••••"}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        togglePassword(teacher.id)
                      }
                      className="rounded-md px-2 py-1 text-xs font-medium text-[#6E94F5] transition hover:bg-blue-50"
                    >
                      {isPasswordVisible
                        ? "Скрыть"
                        : "Показать"}
                    </button>
                  </div>

                  {/* Баланс */}
                  {profile && (
                    <div className="mt-1 text-xs text-slate-400">
                      Баланс:{" "}
                      {Number(
                        profile.balance || 0
                      ).toLocaleString("ru-RU")}{" "}
                      ₽
                    </div>
                  )}
                </div>

                {/* Кнопки */}
                <div className="flex items-center gap-2">
                  {/* Активность */}
                  <button
                    onClick={() =>
                      handleToggleActive(
                        teacher.id,
                        teacher.is_active
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      teacher.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {teacher.is_active
                      ? "Активен"
                      : "Выключен"}
                  </button>

                  {/* Удаление */}
                  <button
                    onClick={() =>
                      handleDelete(teacher)
                    }
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}