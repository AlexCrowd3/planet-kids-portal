import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Phone, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin?: (userData?: any) => void;
}

type AuthStep = "choose" | "phone" | "phone-code" | "register" | "register-code" | "register-children";

interface ChildForm {
  firstName: string;
  lastName: string;
  birthDate: string;
}

const TEST_CODE = "1234";

const normalizePhone = (phone: string) => {
  return phone.replace(/\D/g, "");
};

const formatPhone = (value: string) => {
  const digits = normalizePhone(value);

  if (!digits) {
    return "";
  }

  let normalized = digits;

  if (normalized.startsWith("8")) {
    normalized = `7${normalized.slice(1)}`;
  }

  if (!normalized.startsWith("7")) {
    normalized = `7${normalized}`;
  }

  normalized = normalized.slice(0, 11);

  let result = "+7";

  if (normalized.length > 1) {
    result += ` (${normalized.slice(1, 4)}`;
  }

  if (normalized.length >= 4) {
    result += ")";
  }

  if (normalized.length > 4) {
    result += ` ${normalized.slice(4, 7)}`;
  }

  if (normalized.length > 7) {
    result += `-${normalized.slice(7, 9)}`;
  }

  if (normalized.length > 9) {
    result += `-${normalized.slice(9, 11)}`;
  }

  return result;
};

export default function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const { login, register } = useAuth();

  const [step, setStep] = useState<AuthStep>("choose");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [children, setChildren] = useState<ChildForm[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!open) {
    return null;
  }

  const resetModal = () => {
    setStep("choose");
    setPhone("");
    setCode("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setPasswordConfirm("");
    setChildren([]);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setError("");
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
    setError("");
  };

  const sendTestCode = () => {
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length !== 11) {
      setError("Введите корректный номер телефона");
      return;
    }

    setError("");
    setCode("");
    setStep("phone-code");
  };

  const handlePhoneCodeSubmit = async () => {
    if (code !== TEST_CODE) {
      setError("Неверный код. Для тестирования используйте 1234");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = await login(phone);

      if (!userData) {
        setStep("register");
        setIsLoading(false);
        return;
      }

      onLogin?.(userData);
      handleClose();
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      setError(err?.message || "Не удалось выполнить вход");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSubmit = () => {
    if (!firstName.trim()) {
      setError("Введите имя");
      return;
    }

    if (normalizePhone(phone).length !== 11) {
      setError("Введите корректный номер телефона");
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

    if (password !== passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }

    setError("");
    setStep("register-code");
  };

  const handleRegistrationCodeSubmit = () => {
    if (code !== TEST_CODE) {
      setError("Неверный код. Для тестирования используйте 1234");
      return;
    }

    setError("");
    setStep("register-children");
  };

  const addChild = () => {
    setChildren((current) => [
      ...current,
      {
        firstName: "",
        lastName: "",
        birthDate: "",
      },
    ]);
  };

  const removeChild = (index: number) => {
    setChildren((current) => current.filter((_, childIndex) => childIndex !== index));
  };

  const updateChild = (index: number, field: keyof ChildForm, value: string) => {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              [field]: value,
            }
          : child,
      ),
    );
  };

  const finishRegistration = async () => {
    const invalidChild = children.find(
      (child) => !child.firstName.trim() || !child.birthDate,
    );

    if (invalidChild) {
      setError("Заполните имя и дату рождения каждого ребёнка");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = await register({
        phone,
        firstName,
        lastName,
        children,
      });

      onLogin?.(userData);
      handleClose();
    } catch (err: any) {
      console.error("Ошибка регистрации:", err);

      if (err?.message?.includes("already exists")) {
        setError("Пользователь с таким номером уже существует");
      } else {
        setError(err?.message || "Не удалось создать пользователя");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="mb-7">
      <div className="mb-4 flex items-center justify-between">
        {step !== "choose" ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              if (step === "phone") setStep("choose");
              else if (step === "phone-code") setStep("phone");
              else if (step === "register") setStep("phone");
              else if (step === "register-code") setStep("register");
              else if (step === "register-children") setStep("register-code");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
        >
          <X size={18} />
        </button>
      </div>

      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

      {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
    </div>
  );

  const renderError = () => {
    if (!error) {
      return null;
    }

    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  };

  const renderPhoneInput = () => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Номер телефона
      </label>

      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

        <input
          type="tel"
          value={phone}
          onChange={(event) => handlePhoneChange(event.target.value)}
          placeholder="+7 (999) 123-45-67"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {step === "choose" && (
          <>
            {renderHeader("Вход", "Войдите или создайте аккаунт, чтобы пользоваться возможностями сервиса.")}

            {renderError()}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("phone");
                }}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#646cff] hover:bg-[#646cff]/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#646cff]/10 text-[#646cff]">
                  <Phone size={20} />
                </div>

                <div>
                  <div className="font-semibold text-slate-900">По номеру телефона</div>
                  <div className="mt-1 text-sm text-slate-500">Получить код подтверждения</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("phone");
                }}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#646cff] hover:bg-[#646cff]/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <User size={20} />
                </div>

                <div>
                  <div className="font-semibold text-slate-900">Войти / зарегистрироваться</div>
                  <div className="mt-1 text-sm text-slate-500">Через подтверждение номера</div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "phone" && (
          <>
            {renderHeader("Введите телефон", "Мы отправим код подтверждения на указанный номер.")}

            {renderError()}

            {renderPhoneInput()}

            <button
              type="button"
              onClick={sendTestCode}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#646cff] font-semibold text-white transition hover:bg-[#5558e8]"
            >
              Получить код
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Сейчас используется тестовый код: <b>1234</b>
            </p>
          </>
        )}

        {step === "phone-code" && (
          <>
            {renderHeader("Введите код", `Код отправлен на номер ${phone}`)}

            {renderError()}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Код подтверждения
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
                placeholder="1234"
                className="h-14 w-full rounded-xl border border-slate-200 bg-white text-center text-2xl font-semibold tracking-[0.5em] text-slate-900 outline-none transition focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || code.length !== 4}
              onClick={handlePhoneCodeSubmit}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#646cff] font-semibold text-white transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Проверяем..." : "Продолжить"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCode("");
                setError("");
                setStep("phone");
              }}
              className="mt-3 w-full text-sm font-medium text-[#646cff] hover:underline"
            >
              Изменить номер
            </button>
          </>
        )}

        {step === "register" && (
          <>
            {renderHeader("Создание аккаунта", "Заполните основные данные для регистрации.")}

            {renderError()}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Имя
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Ваше имя"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Фамилия
                </label>

                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Ваша фамилия"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                />
              </div>

              {renderPhoneInput()}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Пароль
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Минимум 6 символов"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Повторите пароль
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    placeholder="Повторите пароль"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegistrationSubmit}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#646cff] font-semibold text-white transition hover:bg-[#5558e8]"
            >
              Продолжить
            </button>
          </>
        )}

        {step === "register-code" && (
          <>
            {renderHeader("Подтверждение номера", `Подтвердите номер ${phone}`)}

            {renderError()}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Код подтверждения
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
                placeholder="1234"
                className="h-14 w-full rounded-xl border border-slate-200 bg-white text-center text-2xl font-semibold tracking-[0.5em] text-slate-900 outline-none transition focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
              />
            </div>

            <button
              type="button"
              disabled={code.length !== 4}
              onClick={handleRegistrationCodeSubmit}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#646cff] font-semibold text-white transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Подтвердить
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Сейчас используется тестовый код: <b>1234</b>
            </p>
          </>
        )}

        {step === "register-children" && (
          <>
            {renderHeader("Дети", "Добавьте детей, чтобы персонализировать ваши занятия.")}

            {renderError()}

            <div className="space-y-4">
              {children.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Пока дети не добавлены
                </div>
              )}

              {children.map((child, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="font-semibold text-slate-900">
                      Ребёнок {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={child.firstName}
                      onChange={(event) => updateChild(index, "firstName", event.target.value)}
                      placeholder="Имя"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                    />

                    <input
                      type="text"
                      value={child.lastName}
                      onChange={(event) => updateChild(index, "lastName", event.target.value)}
                      placeholder="Фамилия"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                    />

                    <input
                      type="date"
                      value={child.birthDate}
                      onChange={(event) => updateChild(index, "birthDate", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/10"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addChild}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-[#646cff]/40 text-sm font-semibold text-[#646cff] transition hover:bg-[#646cff]/5"
              >
                + Добавить ребёнка
              </button>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={finishRegistration}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#646cff] font-semibold text-white transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Создаём аккаунт..." : "Создать аккаунт"}
              {!isLoading && <Check size={18} />}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setChildren([]);
                finishRegistration();
              }}
              className="mt-3 w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Пропустить добавление детей
            </button>
          </>
        )}
      </div>
    </div>
  );
}