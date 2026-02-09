import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle2, Info, HelpCircle, CreditCard, Clock, ChevronRight, ArrowRightLeft } from "lucide-react";

interface SubscribePageProps {
  onBack: () => void;
}

type PlanType = "starter" | "standard" | "premium";
type SubView = "info" | "configure";

const planConfig = {
  starter: { name: "Стартовая", minLessons: 2, maxLessons: 4, pricePerLesson: 500, benefits: ["2-4 занятия", "3 базовых направления", "Ежемесячный бонус +5 баллов"] },
  standard: { name: "Стандарт", minLessons: 4, maxLessons: 12, pricePerLesson: 600, benefits: ["4-12 занятий", "Доступна большая часть направлений", "Ежемесячный бонус +15 баллов"] },
  premium: { name: "Premium+", minLessons: 8, maxLessons: 16, pricePerLesson: 725, benefits: ["8-16 занятий", "Доступны все направления", "Ежемесячный бонус +30 баллов"] },
};

const SubscribePage = ({ onBack }: SubscribePageProps) => {
  const { user } = useAuth();
  const [view, setView] = useState<SubView>(user.subscriptionActive ? "info" : "configure");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("premium");
  const [lessonsCount, setLessonsCount] = useState(8);
  const [carryOver, setCarryOver] = useState(false);

  const plan = planConfig[selectedPlan];
  const basePrice = lessonsCount * plan.pricePerLesson;
  const totalPrice = basePrice + (carryOver ? 500 : 0);

  const switchPlan = (p: PlanType) => {
    setSelectedPlan(p);
    setLessonsCount(planConfig[p].minLessons);
  };

  if (view === "info" && user.subscriptionActive) {
    return (
      <div className="animate-fade-in p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-primary-opacity">Подписка</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Status */}
            <div className="flex gap-3">
              <div className="glass-premium px-5 py-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-bold">Premium+</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Активна до {user.subscriptionDate}</span>
                </div>
              </div>
              <div className="gradient-orange rounded-2xl px-5 py-3 flex-1 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/80">Вам доступно:</p>
                  <HelpCircle className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-bold">{user.points}</span>
                  <span className="text-sm">баллов</span>
                </div>
              </div>
            </div>

            {/* Remaining */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-secondary-opacity text-sm">Осталось занятий:</p>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-primary-opacity">3</span>
                <button className="gradient-orange text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">Увеличить</button>
              </div>
            </div>

            {/* What's included */}
            <div>
              <h2 className="text-xl font-bold text-primary-opacity mb-4">Что входит в Premium+?</h2>
              <div className="space-y-3">
                {planConfig.premium.benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-primary-opacity font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Points info */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-primary mb-3">Зачем нужны баллы?</h3>
              <div className="space-y-1 text-sm text-secondary-opacity">
                <p>100 баллов — дополнительное занятие</p>
                <p>250 баллов — мастер-класс в подарок</p>
                <p>500 баллов — игрушка на выбор</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <button onClick={() => setView("configure")} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Изменить подписку
            </button>
            <div className="glass-card p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-secondary-opacity">Вы можете изменить тариф. Со следующего месяца подписка обновится.</p>
            </div>
            <p className="text-center text-xs text-secondary-opacity">
              Подписку необходимо будет оплатить заранее! Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Configure / checkout view
  return (
    <div className="animate-fade-in p-4 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={user.subscriptionActive ? () => setView("info") : onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-primary-opacity">Оформление подписки</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Info banner */}
          <div className="glass-card p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary-opacity">
              При оформлении подписки у вас есть возможность настроить тариф под себя, а умный алгоритм подсчитает корректную стоимость тарифа исходя из ваших запросов.
            </p>
          </div>

          {/* Plan selection */}
          <div>
            <h2 className="text-xl font-bold text-primary-opacity mb-4">Настроить подписку</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["starter", "standard", "premium"] as PlanType[]).map((p) => {
                const cfg = planConfig[p];
                const isActive = selectedPlan === p;
                return (
                  <button key={p} onClick={() => switchPlan(p)} className={`rounded-2xl p-4 text-left transition-all ${isActive ? "glass-premium" : "glass-card"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-bold">{cfg.name}</span>
                    </div>
                    <p className={`text-xs ${isActive ? "text-white/80" : "text-secondary-opacity"}`}>Срок: 1 месяц</p>
                    <div className="mt-3 space-y-1">
                      {cfg.benefits.map((b) => (
                        <p key={b} className={`text-xs ${isActive ? "text-white/80" : "text-secondary-opacity"}`}>✓ {b}</p>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Benefits detail */}
          <div className="space-y-3">
            {plan.benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-primary-opacity font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - configurator */}
        <div className="space-y-5">
          {/* Lessons slider */}
          <div>
            <h3 className="font-bold text-primary-opacity mb-3">Количество занятий</h3>
            <input
              type="range"
              min={plan.minLessons}
              max={plan.maxLessons}
              value={lessonsCount}
              onChange={(e) => setLessonsCount(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(223 88% 70%) 0%, hsl(223 88% 70%) ${((lessonsCount - plan.minLessons) / (plan.maxLessons - plan.minLessons)) * 100}%, hsl(0 0% 90%) ${((lessonsCount - plan.minLessons) / (plan.maxLessons - plan.minLessons)) * 100}%, hsl(0 0% 90%) 100%)`,
              }}
            />
            <p className="text-center text-3xl font-bold text-primary-opacity mt-3">{lessonsCount}</p>
          </div>

          {/* Carry-over option */}
          <div className="glass-card p-4">
            <button onClick={() => setCarryOver(!carryOver)} className="w-full flex items-center gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${carryOver ? "border-primary bg-primary" : "border-border"}`}>
                {carryOver && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-primary-opacity text-sm">Переносить занятия на следующий месяц</p>
                <p className="text-xs text-secondary-opacity">+500 ₽ к стоимости</p>
              </div>
            </button>
          </div>

          {/* Price */}
          <div>
            <p className="text-secondary-opacity text-sm">Итоговая стоимость</p>
            <p className="text-4xl font-bold text-primary-opacity">{totalPrice.toLocaleString("ru-RU")} ₽</p>
            {carryOver && <p className="text-xs text-secondary-opacity mt-1">Включая +500 ₽ за перенос занятий</p>}
          </div>

          {/* CTA */}
          <button className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            Оформить <CreditCard className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-secondary-opacity">
            Подписку необходимо будет оплатить заранее! Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
