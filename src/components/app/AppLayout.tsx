import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import HomePage from "@/components/app/HomePage";
import CalendarPage from "@/components/app/CalendarPage";
import DirectionsPage from "@/components/app/DirectionsPage";
import NotificationsPage from "@/components/app/NotificationsPage";
import ProfilePage from "@/components/app/ProfilePage";
import SettingsPage from "@/components/app/SettingsPage";
import SubscribePage from "@/components/app/SubscribePage";
import {
  Home,
  CalendarDays,
  Globe,
  Bell,
  User,
  Menu,
  X,
  Star,
} from "lucide-react";

type TabId = "home" | "calendar" | "directions" | "notifications" | "profile";
type ViewId = TabId | "settings" | "subscribe";

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "directions", label: "Направления", icon: Globe },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "profile", label: "Профиль", icon: User },
];

const AppLayout = () => {
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navigateTo = (view: ViewId) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return <HomePage onNavigate={navigateTo} />;
      case "calendar":
        return <CalendarPage />;
      case "directions":
        return <DirectionsPage />;
      case "notifications":
        return <NotificationsPage onNavigate={navigateTo} />;
      case "profile":
        return <ProfilePage onNavigate={navigateTo} />;
      case "settings":
        return <SettingsPage onBack={() => navigateTo("home")} onNavigate={navigateTo} />;
      case "subscribe":
        return <SubscribePage onBack={() => navigateTo("home")} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  const activeTab = (["home", "calendar", "directions", "notifications", "profile"] as TabId[]).includes(
    activeView as TabId
  )
    ? activeView
    : "home";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Star className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-primary-opacity hidden sm:inline">Дети на планете</span>
          </div>

          {/* Desktop nav items in header */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                    isActive
                      ? "gradient-primary text-primary-foreground font-semibold"
                      : "text-secondary-opacity hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-background shadow-elevated p-6 pt-20 animate-slide-in-right">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    activeTab === tab.id
                      ? "gradient-primary text-primary-foreground font-semibold"
                      : "text-secondary-opacity hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-secondary-opacity">
                👋 {user.firstName}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <main className="flex-1 pt-16">
        <div className="max-w-lg mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
