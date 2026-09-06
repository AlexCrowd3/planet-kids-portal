import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  target_role: string;
  created_at: string;
  expires_at: string | null;
};

export default function NotificationsPage() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    target_role: "all",
    type: "info",
  });

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Создаём уведомление
      const { data: notification, error: insertError } = await supabase
        .from("notifications")
        .insert({
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
          target_role: form.target_role,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      // 2. Раздаём пользователям
      let usersQuery = supabase
        .from("users")
        .select("id")
        .eq("is_active", true);

      if (form.target_role === "parent") {
        usersQuery = usersQuery.eq("role", "parent");
      } else if (form.target_role === "teacher") {
        usersQuery = usersQuery.eq("role", "teacher");
      }

      const { data: users, error: usersError } = await usersQuery;

      if (usersError) {
        setError(usersError.message);
        setSaving(false);
        return;
      }

      if (users && users.length > 0) {
        const rows = users.map((u) => ({
          user_id: u.id,
          notification_id: notification.id,
          is_read: false,
        }));

        const { error: linkError } = await supabase
          .from("user_notifications")
          .insert(rows);

        if (linkError) {
          setError(linkError.message);
          setSaving(false);
          return;
        }

        setSuccess(`Уведомление отправлено ${users.length} пользователям`);
      } else {
        setSuccess("Уведомление создано, но подходящих пользователей не найдено");
      }

      setForm({
        title: "",
        message: "",
        target_role: "all",
        type: "info",
      });

      await loadNotifications();
    } catch (err: any) {
      setError(err?.message || "Неизвестная ошибка");
    }

    setSaving(false);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Уведомления</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 mb-10">
        <div>
          <label className="mb-1 block text-sm">Заголовок</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-border bg-secondary/50 p-2"
            placeholder="Введите заголовок"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Сообщение</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-border bg-secondary/50 p-2"
            rows={4}
            placeholder="Введите текст уведомления"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Тип</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-lg border border-border bg-secondary/50 p-2"
          >
            <option value="info">Информация</option>
            <option value="warning">Предупреждение</option>
            <option value="success">Успех</option>
            <option value="system">Системное</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Получатели</label>
          <select
            value={form.target_role}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
            className="w-full rounded-lg border border-border bg-secondary/50 p-2"
          >
            <option value="all">Все</option>
            <option value="parent">Родители</option>
            <option value="teacher">Педагоги</option>
          </select>
        </div>

        <Button type="submit" className="gradient-primary" disabled={saving}>
          {saving ? "Отправляем..." : "Отправить уведомление"}
        </Button>
      </form>

      {/* Список */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">История</h2>

        {loading ? (
          <div className="opacity-60">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="opacity-60">Уведомлений пока нет</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                      {item.message}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      {formatDate(item.created_at)} · {item.target_role} · {item.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}