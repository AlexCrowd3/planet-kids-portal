import { useEffect, useState } from "react";
import { ArrowDownLeft, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TeacherSession } from "@/pages/TeacherApp";

type Props = {
  teacher: TeacherSession;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

const TeacherBalance = ({ teacher }: Props) => {
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [{ data: profile }, { data: payoutData }] = await Promise.all([
          supabase
            .from("teacher_profiles")
            .select("balance")
            .eq("teacher_id", teacher.id)
            .maybeSingle(),

          supabase
            .from("teacher_payouts")
            .select("id, amount, status, created_at, paid_at")
            .eq("teacher_id", teacher.id)
            .order("created_at", { ascending: false }),
        ]);

        setBalance(Number(profile?.balance ?? 0));
        setPayouts(
          (payoutData ?? []).map((item) => ({
            ...item,
            amount: Number(item.amount),
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [teacher.id]);

  const paidAmount = payouts
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  const pendingAmount = payouts
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Баланс
        </h1>

        <p className="mt-1 text-sm text-secondary-opacity">
          Ваши начисления и выплаты
        </p>
      </div>

      <div className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">Текущий баланс</p>

            <p className="mt-2 text-4xl font-bold">
              {balance.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-secondary-opacity">
            Выплачено
          </p>

          <p className="mt-2 text-2xl font-bold text-foreground">
            {paidAmount.toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-secondary-opacity">
            Ожидает выплаты
          </p>

          <p className="mt-2 text-2xl font-bold text-foreground">
            {pendingAmount.toLocaleString("ru-RU")} ₽
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-foreground">
          История выплат
        </h2>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-secondary-opacity">
            Загружаем...
          </div>
        ) : payouts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <ArrowDownLeft className="mx-auto h-9 w-9 text-secondary-opacity" />

            <p className="mt-3 font-medium text-foreground">
              Выплат пока нет
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Выплата
                  </p>

                  <p className="mt-1 text-xs text-secondary-opacity">
                    {new Date(payout.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {payout.amount.toLocaleString("ru-RU")} ₽
                  </p>

                  <p className="mt-1 text-xs text-secondary-opacity">
                    {payout.status === "paid"
                      ? "Выплачено"
                      : payout.status === "pending"
                        ? "Ожидает"
                        : payout.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherBalance;