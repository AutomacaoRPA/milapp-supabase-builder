
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours: number;
  description: string | null;
  date: string;
  created_at: string;
}

export const useTimeEntries = (taskId?: string) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("time_entries")
        .select("*")
        .order("date", { ascending: false });

      if (taskId) {
        query = query.eq("task_id", taskId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error("Erro ao buscar registros de tempo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de tempo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTimeEntry = async (entryData: Omit<TimeEntry, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert([entryData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de tempo criado com sucesso!",
      });

      await fetchTimeEntries();
      return data;
    } catch (error) {
      console.error("Erro ao criar registro de tempo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de tempo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [taskId]);

  return {
    timeEntries,
    loading,
    fetchTimeEntries,
    createTimeEntry,
  };
};
