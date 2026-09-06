import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_payment_id: string | null;
  contract_number: number | null;
  contract_label: string | null;
  created_at: string;
  paid_at: string | null;
  users?: {
    first_name: string;
    last_name: string | null;
    phone: string;
  } | null;
};

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadPayments = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("payments")
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const formatMoney = (amount: number, currency = "RUB") =>
    `${Number(amount).toLocaleString("ru-RU")} ${currency === "RUB" ? "₽" : currency}`;

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Оплачен";
      case "pending":
        return "Ожидает";
      case "failed":
        return "Ошибка";
      case "canceled":
        return "Отменён";
      default:
        return status;
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "canceled":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const totalPaid = items
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Платежи</h1>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="all">Все статусы</option>
          <option value="paid">Оплачен</option>
          <option value="pending">Ожидает</option>
          <option value="failed">Ошибка</option>
          <option value="canceled">Отменён</option>
        </select>
      </div>

      {/* Краткая сводка */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Всего в списке</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Сумма оплаченных</p>
          <p className="text-2xl font-bold">{formatMoney(totalPaid)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="opacity-60">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="opacity-60">Платежей пока нет</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const userName = item.users
              ? `${item.users.first_name}${item.users.last_name ? " " + item.users.last_name : ""}`
              : "—";

            return (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">
                        {formatMoney(item.amount, item.currency)}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {userName}
                      {item.users?.phone && (
                        <span className="text-slate-400"> · {item.users.phone}</span>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                      <div>Создан: {formatDate(item.created_at)}</div>
                      <div>Оплачен: {formatDate(item.paid_at)}</div>
                      {item.provider && <div>Провайдер: {item.provider}</div>}
                      {item.contract_label && (
                        <div>Договор: {item.contract_label}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}