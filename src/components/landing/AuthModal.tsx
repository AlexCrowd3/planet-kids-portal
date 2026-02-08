import { useState } from "react";
import { X, LogIn } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AuthModal = ({ open, onClose, onLogin }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-card p-8 shadow-elevated">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-primary-opacity">Добро пожаловать!</h2>
            <p className="text-secondary-opacity text-sm mt-2">
              Войдите в личный кабинет «Дети на планете»
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-opacity mb-1.5">
                Имя или Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите имя или email"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-opacity mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-elevated hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Авторизоваться
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Нажимая «Авторизоваться», вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
