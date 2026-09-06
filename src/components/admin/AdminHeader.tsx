import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";

const AdminHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="glass border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
      </div>
    </header>
  );
};

export default AdminHeader;