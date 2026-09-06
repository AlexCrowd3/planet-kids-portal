import { supabase } from "../lib/supabase";

export const AuthService = {
  async login(phone: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) throw error;

    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );

    return data;
  },

  getCurrentUser() {
    const raw = localStorage.getItem("user");

    if (!raw) return null;

    return JSON.parse(raw);
  },

  logout() {
    localStorage.removeItem("user");
  }
};