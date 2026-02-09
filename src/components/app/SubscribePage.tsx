import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle2, Info, HelpCircle, CreditCard, Clock } from "lucide-react";

interface SubscribePageProps {
  onBack: () => void;
}

const SubscribePage = ({ onBack }: SubscribePageProps) => {
  const { user } = useAuth();
  const [lessonsCount, setLessonsCount] = useState(6);
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("premium");

  const pricePerLesson = selectedPlan === "premium" ? 725 : 600;
  const totalPrice = lessonsCount * pricePerLesson;

  return (
    <div className="animate-fade-in p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-primary-opacity">Подписка</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - status & benefits */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status widget */}
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

          {/* Info */}
          <div className="glass-card p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary-opacity">
              Вы можете увеличить количество занятий и со следующего месяца тариф изменится.
            </p>
          </div>

          {/* Remaining classes */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-secondary-opacity text-sm">Осталось занятий:</p>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-primary-opacity">3</span>
              <button className="gradient-orange text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                Увеличить
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-xl font-bold text-primary-opacity mb-4">Что даёт Premium+?</h2>
            <div className="space-y-3">
              {[
                "8-16 занятий",
                "Доступны все направления",
                "Ежемесячный бонус +30 баллов",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-primary-opacity font-medium">{benefit}</span>
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

        {/* Right column - plan configurator */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-primary-opacity">Настроить подписку</h2>
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedPlan("standard"); setLessonsCount(4); }}
              className={`w-full rounded-2xl p-4 text-left transition-all ${
                selectedPlan === "standard" ? "glass-premium" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5" />
                <span className="font-bold">Стандарт</span>
              </div>
              <p className={`text-xs ${selectedPlan === "standard" ? "text-white/80" : "text-secondary-opacity"}`}>
                Срок: 1 месяц
              </p>
              <div className="mt-3 space-y-1">
                <p className={`text-xs ${selectedPlan === "standard" ? "text-white/80" : "text-secondary-opacity"}`}>✓ 4-12 занятий</p>
                <p className={`text-xs ${selectedPlan === "standard" ? "text-white/80" : "text-secondary-opacity"}`}>✓ Доступна большая часть направлений</p>
                <p className={`text-xs ${selectedPlan === "standard" ? "text-white/80" : "text-secondary-opacity"}`}>✓ Ежемесячный бонус +15 баллов</p>
              </div>
            </button>
            <button
              onClick={() => { setSelectedPlan("premium"); setLessonsCount(8); }}
              className={`w-full rounded-2xl p-4 text-left transition-all ${
                selectedPlan === "premium" ? "glass-premium" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5" />
                <span className="font-bold">Premium+</span>
              </div>
              <p className={`text-xs ${selectedPlan === "premium" ? "text-white/80" : "text-secondary-opacity"}`}>
                Срок: 1 месяц
              </p>
              <div className="mt-3 space-y-1">
                <p className={`text-xs ${selectedPlan === "premium" ? "text-white/80" : "text-secondary-opacity"}`}>✓ 8-16 занятий</p>
                <p className={`text-xs ${selectedPlan === "premium" ? "text-white/80" : "text-secondary-opacity"}`}>✓ Доступны все направления</p>
                <p className={`text-xs ${selectedPlan === "premium" ? "text-white/80" : "text-secondary-opacity"}`}>✓ Ежемесячный бонус +30 баллов</p>
              </div>
            </button>
          </div>

          {/* Lessons slider */}
          <div>
            <h3 className="font-bold text-primary-opacity mb-3">Количество занятий</h3>
            <input
              type="range"
              min={selectedPlan === "standard" ? 4 : 8}
              max={selectedPlan === "standard" ? 12 : 16}
              value={lessonsCount}
              onChange={(e) => setLessonsCount(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(223 88% 70%) 0%, hsl(223 88% 70%) ${
                  ((lessonsCount - (selectedPlan === "standard" ? 4 : 8)) /
                    (selectedPlan === "standard" ? 8 : 8)) *
                  100
                }%, hsl(0 0% 90%) ${
                  ((lessonsCount - (selectedPlan === "standard" ? 4 : 8)) /
                    (selectedPlan === "standard" ? 8 : 8)) *
                  100
                }%, hsl(0 0% 90%) 100%)`,
              }}
            />
            <p className="text-center text-3xl font-bold text-primary-opacity mt-3">
              {lessonsCount}
            </p>
          </div>

          {/* Price */}
          <div>
            <p className="text-secondary-opacity text-sm">Итоговая стоимость</p>
            <p className="text-4xl font-bold text-primary-opacity">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          {/* CTA */}
          <button className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            Оформить <CreditCard className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-secondary-opacity">
            Подписку необходимо будет оплатить заранее!
            Сделать это можно написав в поддержку или лично по адресу Ясная 14к2
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
