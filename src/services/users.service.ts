import { supabase } from "../lib/supabase";

export const UsersService = {
  async getUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) throw error;

    return data;
  },

  async createUser(payload: any) {
    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateUser(id: string, payload: any) {
    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }
};