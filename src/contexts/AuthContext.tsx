import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserChild {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: string;
  gender: string | null;
}

export interface UserData {
  id: string;
  name: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  children: UserChild[];
  points: number;
  subscriptionActive: boolean;
  subscriptionDate: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  login: (phone: string) => Promise<UserData | null>;
  register: (data: RegisterData) => Promise<UserData | null>;
  logout: () => void;
  updateUser: (userData: Partial<UserData>) => void;
  refreshUser: () => Promise<UserData | null>;
}

export interface RegisterChildData {
  firstName: string;
  lastName: string;
  birthDate: string;
}

export interface RegisterData {
  phone: string;
  firstName: string;
  lastName: string;
  children: RegisterChildData[];
}

const AUTH_STORAGE_KEY = "planet-kids-auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

const normalizePhone = (phone: string) => {
  return phone.replace(/\D/g, "");
};

const formatPhoneForDatabase = (phone: string) => {
  const digits = normalizePhone(phone);

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  return phone.trim();
};

const buildUserData = async (userId: string): Promise<UserData | null> => {
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, phone, first_name, last_name, bonus_points")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Ошибка загрузки пользователя:", profileError);
    throw profileError;
  }

  if (!profile) {
    return null;
  }

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, first_name, last_name, birth_date, gender")
    .eq("parent_id", userId)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("Ошибка загрузки детей:", childrenError);
    throw childrenError;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("user_subscriptions")
    .select("id, end_date, is_active, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    console.error("Ошибка загрузки подписки:", subscriptionError);
    throw subscriptionError;
  }

  const mappedChildren: UserChild[] = (children ?? []).map((child) => ({
    id: child.id,
    firstName: child.first_name,
    lastName: child.last_name,
    birthDate: child.birth_date,
    gender: child.gender,
  }));

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const userData: UserData = {
    id: profile.id,
    name: fullName || profile.first_name || "Пользователь",
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    children: mappedChildren,
    points: profile.bonus_points ?? 0,
    subscriptionActive: Boolean(subscription),
    subscriptionDate: subscription?.end_date ?? null,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

  return userData;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

        if (!savedUser) {
          setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(savedUser) as UserData;

        if (!parsedUser?.id || !parsedUser?.phone) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        const freshUser = await buildUserData(parsedUser.id);

        if (freshUser) {
          setUser(freshUser);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Ошибка восстановления пользователя:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (phone: string) => {
    try {
      const normalizedPhone = formatPhoneForDatabase(phone);

      const { data: profile, error } = await supabase
        .from("users")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (error) {
        console.error("Ошибка поиска пользователя:", error);
        throw error;
      }

      if (!profile) {
        return null;
      }

      const userData = await buildUserData(profile.id);

      if (!userData) {
        return null;
      }

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      console.error("Ошибка входа:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const phone = formatPhoneForDatabase(data.phone);

      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingUserError) {
        console.error("Ошибка проверки номера:", existingUserError);
        throw existingUserError;
      }

      if (existingUser) {
        throw new Error("Пользователь с таким номером уже существует");
      }

      const { data: createdUser, error: userError } = await supabase
        .from("users")
        .insert({
          phone,
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim() || null,
          is_phone_verified: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (userError) {
        console.error("Ошибка создания пользователя:", userError);
        throw userError;
      }

      if (!createdUser) {
        throw new Error("Пользователь не был создан");
      }

      if (data.children.length > 0) {
        const childrenToInsert = data.children
          .filter((child) => child.firstName.trim() && child.birthDate)
          .map((child) => ({
            parent_id: createdUser.id,
            first_name: child.firstName.trim(),
            last_name: child.lastName.trim() || null,
            birth_date: child.birthDate,
          }));

        if (childrenToInsert.length > 0) {
          const { error: childrenError } = await supabase
            .from("children")
            .insert(childrenToInsert);

          if (childrenError) {
            console.error("Ошибка создания детей:", childrenError);
            throw childrenError;
          }
        }
      }

      const userData = await buildUserData(createdUser.id);

      if (!userData) {
        throw new Error("Не удалось загрузить созданного пользователя");
      }

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user?.id) {
      return null;
    }

    try {
      const freshUser = await buildUserData(user.id);

      if (!freshUser) {
        logout();
        return null;
      }

      setUser(freshUser);
      setIsAuthenticated(true);

      return freshUser;
    } catch (error) {
      console.error("Ошибка обновления пользователя:", error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<UserData>) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return null;
      }

      const updatedUser = {
        ...currentUser,
        ...userData,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

      return updatedUser;
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};