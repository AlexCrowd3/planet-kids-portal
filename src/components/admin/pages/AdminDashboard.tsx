import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = {
  users: number
  activeSubscriptions: number
  paymentsToday: number
  paymentsTodaySum: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    activeSubscriptions: 0,
    paymentsToday: 0,
    paymentsTodaySum: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const [
        { count: usersCount },
        { count: subsCount },
        { data: paymentsData },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', todayISO),
      ])

      const paymentsToday = paymentsData?.length || 0
      const paymentsTodaySum = paymentsData?.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      ) || 0

      setStats({
        users: usersCount || 0,
        activeSubscriptions: subsCount || 0,
        paymentsToday,
        paymentsTodaySum,
      })

      setLoading(false)
    }

    loadStats()
  }, [])

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Админ дашборд</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Пользователи"
          value={loading ? '...' : String(stats.users)}
          description="Всего зарегистрировано"
        />

        <StatCard
          title="Активные подписки"
          value={loading ? '...' : String(stats.activeSubscriptions)}
          description="Сейчас действуют"
        />

        <StatCard
          title="Платежи сегодня"
          value={loading ? '...' : `${stats.paymentsTodaySum.toLocaleString('ru-RU')} ₽`}
          description={`${stats.paymentsToday} платежей`}
        />
      </div>

      <div className="glass-card mt-6 rounded-xl p-6">
        <h2 className="mb-2 text-lg font-semibold">Быстрый обзор</h2>
        <p className="text-sm opacity-60">
          Данные обновляются при открытии страницы.
        </p>
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) => (
  <div className="glass-card rounded-xl p-6 shadow">
    <p className="mb-1 text-sm opacity-70">{title}</p>
    <h2 className="mb-2 text-3xl font-bold">{value}</h2>
    <p className="text-xs opacity-60">{description}</p>
  </div>
)