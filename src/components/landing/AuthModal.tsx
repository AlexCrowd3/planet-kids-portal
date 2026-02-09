import { useState } from "react";
import { X, LogIn, Phone, ArrowRight, ChevronLeft, UserPlus, User, Plus, SkipForward } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

type AuthStep = "choose" | "login" | "phone" | "phone-code" | "register" | "register-code" | "register-children";

const AuthModal = ({ open, onClose, onLogin }: AuthModalProps) => {
  const [step, setStep] = useState<AuthStep>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [children, setChildren] = useState<string[]>([""]);

  if (!open) return null;

  const resetState = () => {
    setStep("choose");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setCode("");
    setRegName("");
    setRegPhone("");
    setRegPassword("");
    setRegPasswordConfirm("");
    setChildren([""]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFinalLogin = () => {
    resetState();
    onLogin();
  };

  const addChild = () => setChildren([...children, ""]);
  const updateChild = (idx: number, val: string) => {
    const updated = [...children];
    updated[idx] = val;
    setChildren(updated);
  };
  const removeChild = (idx: number) => {
    if (children.length > 1) setChildren(children.filter((_, i) => i !== idx));
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const renderStep = () => {
    switch (step) {
      case "choose":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-primary-opacity">Добро пожаловать!</h2>
              <p className="text-secondary-opacity text-sm mt-2">Выберите способ входа</p>
            </div>
            <button onClick={() => setStep("login")} className="w-full glass-card px-4 py-4 flex items-center gap-3 hover:shadow-elevated transition-all">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <LogIn className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-primary-opacity">Войти по логину</p>
                <p className="text-xs text-secondary-opacity">Email и пароль</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setStep("phone")} className="w-full glass-card px-4 py-4 flex items-center gap-3 hover:shadow-elevated transition-all">
              <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-primary-opacity">Войти по телефону</p>
                <p className="text-xs text-secondary-opacity">Код подтверждения в SMS</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">или</span></div>
            </div>
            <button onClick={() => setStep("register")} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" /> Зарегистрироваться
            </button>
          </div>
        );

      case "login":
        return (
          <div className="space-y-4">
            <button onClick={() => setStep("choose")} className="flex items-center gap-1 text-sm text-secondary-opacity hover:text-primary transition-colors mb-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-primary-opacity">Вход в аккаунт</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleFinalLogin(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Имя или Email</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Введите имя или email" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Пароль</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" className={inputClass} />
              </div>
              <button type="submit" className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
                Авторизоваться
              </button>
            </form>
          </div>
        );

      case "phone":
        return (
          <div className="space-y-4">
            <button onClick={() => setStep("choose")} className="flex items-center gap-1 text-sm text-secondary-opacity hover:text-primary transition-colors mb-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full gradient-orange flex items-center justify-center mx-auto mb-3">
                <Phone className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-primary-opacity">Вход по телефону</h2>
              <p className="text-sm text-secondary-opacity mt-1">Мы отправим SMS с кодом подтверждения</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Номер телефона</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+7 (___) ___-__-__" className={inputClass} />
            </div>
            <button onClick={() => setStep("phone-code")} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
              Получить код
            </button>
          </div>
        );

      case "phone-code":
        return (
          <div className="space-y-4">
            <button onClick={() => setStep("phone")} className="flex items-center gap-1 text-sm text-secondary-opacity hover:text-primary transition-colors mb-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-primary-opacity">Введите код</h2>
              <p className="text-sm text-secondary-opacity mt-1">Код отправлен на {phoneNumber || "+7 (***)"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Код из SMS</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="• • • •" maxLength={4} className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`} />
            </div>
            <button onClick={handleFinalLogin} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
              Подтвердить
            </button>
            <button className="w-full text-center text-sm text-secondary-opacity hover:text-primary transition-colors">
              Отправить код повторно
            </button>
          </div>
        );

      case "register":
        return (
          <div className="space-y-4">
            <button onClick={() => setStep("choose")} className="flex items-center gap-1 text-sm text-secondary-opacity hover:text-primary transition-colors mb-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-primary-opacity">Регистрация</h2>
              <p className="text-sm text-secondary-opacity mt-1">Создайте аккаунт в «Дети на планете»</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep("register-code"); }} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Ваше имя</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Как к вам обращаться?" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Номер телефона</label>
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Пароль</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Придумайте пароль" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Подтвердите пароль</label>
                <input type="password" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} placeholder="Повторите пароль" className={inputClass} />
              </div>
              <button type="submit" className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
                Получить код
              </button>
            </form>
          </div>
        );

      case "register-code":
        return (
          <div className="space-y-4">
            <button onClick={() => setStep("register")} className="flex items-center gap-1 text-sm text-secondary-opacity hover:text-primary transition-colors mb-2">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-primary-opacity">Подтверждение</h2>
              <p className="text-sm text-secondary-opacity mt-1">Код отправлен на {regPhone || "+7 (***)"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-opacity mb-1.5">Код из SMS</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="• • • •" maxLength={4} className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`} />
            </div>
            <button onClick={() => setStep("register-children")} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
              Подтвердить
            </button>
            <button className="w-full text-center text-sm text-secondary-opacity hover:text-primary transition-colors">
              Отправить код повторно
            </button>
          </div>
        );

      case "register-children":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-primary-opacity">Добавьте детей</h2>
              <p className="text-sm text-secondary-opacity mt-1">Это можно сделать позже в личном кабинете</p>
            </div>
            <div className="space-y-3">
              {children.map((child, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={child}
                    onChange={(e) => updateChild(idx, e.target.value)}
                    placeholder={`Имя ребёнка ${idx + 1}`}
                    className={`${inputClass} flex-1`}
                  />
                  {children.length > 1 && (
                    <button onClick={() => removeChild(idx)} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addChild} className="w-full glass-card py-3 rounded-xl font-medium text-sm text-secondary-opacity hover:text-primary transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Добавить ещё ребёнка
            </button>
            <button onClick={handleFinalLogin} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]">
              Завершить регистрацию
            </button>
            <button onClick={handleFinalLogin} className="w-full text-center text-sm text-secondary-opacity hover:text-primary transition-colors flex items-center justify-center gap-1">
              <SkipForward className="w-4 h-4" /> Пропустить
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className="relative w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="glass-card p-8 shadow-elevated">
          <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
          {renderStep()}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
