import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [status, setStatus] = useState("Проверка...");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        setStatus("Подключаемся к Supabase...");
        setError(null);
        setDetails(null);

        // Простой запрос к базе
        const { data, error: dbError } = await supabase
          .from("users")
          .select("id")
          .limit(1);

        if (dbError) {
          setStatus("❌ Ошибка подключения");
          setError(dbError.message);
          setDetails(JSON.stringify(dbError, null, 2));
          return;
        }

        setStatus("✅ Подключение к Supabase работает");
        setDetails(`Успешный ответ. Найдено записей: ${data?.length ?? 0}`);
      } catch (err: any) {
        setStatus("❌ Критическая ошибка");
        setError(err?.message || "Неизвестная ошибка");
        setDetails(String(err));
      }
    };

    check();
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Диагностика подключения</h1>

      <div className="glass-card rounded-xl p-6 space-y-3">
        <p className="font-medium">{status}</p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Ошибка:</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {details && (
          <pre className="text-xs opacity-70 bg-slate-50 p-3 rounded-lg overflow-auto">
            {details}
          </pre>
        )}
      </div>
    </div>
  );
}