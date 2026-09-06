import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
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
    phone: "",
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeachers = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        phone,
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

  const handleAdd = async () => {
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError("Имя и телефон обязательны");
      return;
    }

    setSaving(true);
    setError(null);

    // 1. Создаём пользователя-педагога
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim(),
        role: "teacher",
        is_active: true,
        is_phone_verified: false,
      })
      .select()
      .single();

    if (userError) {
      setError(userError.message);
      setSaving(false);
      return;
    }

    // 2. Создаём профиль педагога
    const { error: profileError } = await supabase
      .from("teacher_profiles")
      .insert({
        teacher_id: user.id,
        balance: 0,
      });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    setForm({
      first_name: "",
      last_name: "",
      phone: "",
    });

    await loadTeachers();
    setSaving(false);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_active: !current })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadTeachers();
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Учителя</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Форма */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          placeholder="Имя *"
          className="rounded-lg border px-4 py-2"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />

        <input
          placeholder="Фамилия"
          className="rounded-lg border px-4 py-2"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />

        <input
          placeholder="Телефон *"
          className="rounded-lg border px-4 py-2"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <button
        className="mb-6 rounded-lg bg-[#6E94F5] px-4 py-2 text-white font-medium hover:bg-[#5A82E0] disabled:opacity-50"
        onClick={handleAdd}
        disabled={saving}
      >
        {saving ? "Сохраняем..." : "Добавить учителя"}
      </button>

      {/* Список */}
      {loading ? (
        <div className="opacity-60">Загрузка...</div>
      ) : teachers.length === 0 ? (
        <div className="opacity-60">Учителей пока нет</div>
      ) : (
        <div className="space-y-3">
          {teachers.map((teacher) => {
            const profile = Array.isArray(teacher.teacher_profiles)
              ? teacher.teacher_profiles[0]
              : teacher.teacher_profiles;

            return (
              <div
                key={teacher.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                <div>
                  <div className="font-medium">
                    {teacher.first_name} {teacher.last_name || ""}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {teacher.phone}
                  </div>
                  {profile && (
                    <div className="text-xs text-slate-400 mt-1">
                      Баланс: {Number(profile.balance || 0).toLocaleString("ru-RU")} ₽
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    teacher.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {teacher.is_active ? "Активен" : "Выключен"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}