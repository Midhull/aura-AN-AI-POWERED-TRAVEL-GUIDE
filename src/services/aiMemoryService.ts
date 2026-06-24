import { supabase } from "./supabase/client";

export interface TravelMemory {
  id: string;
  userId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export const aiMemoryService = {
  async saveMemory(
    userId: string,
    content: string,
    embedding: number[], // 1536 float array from LLM embedding API
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase.from("travel_memories").insert({
      user_id: userId,
      content,
      embedding,
      metadata,
    });

    if (error) throw error;
  },

  async searchMemories(
    userId: string,
    queryEmbedding: number[],
    threshold = 0.7,
    limit = 5
  ): Promise<SemanticSearchResult[]> {
    const { data, error } = await supabase.rpc("match_memories", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  },

  async buildRAGContext(userId: string, queryEmbedding: number[]): Promise<string> {
    try {
      const memories = await this.searchMemories(userId, queryEmbedding, 0.65, 4);
      if (memories.length === 0) return "No historical travel memories matches found.";

      return memories
        .map((m, i) => `[Memory #${i + 1}] (Captured: ${m.metadata.category || "General"}): "${m.content}"`)
        .join("\n");
    } catch (err) {
      console.error("Failed to build RAG context:", err);
      return "Context builder failed due to database query errors.";
    }
  },
};
