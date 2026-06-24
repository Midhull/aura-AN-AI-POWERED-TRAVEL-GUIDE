-- Migration: Database Indexes for Enterprise-grade Scaling
-- Standard B-Tree indexes for Foreign Keys
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS traveler_profiles_user_id_idx ON public.traveler_profiles(user_id);
CREATE INDEX IF NOT EXISTS budgets_trip_id_idx ON public.budgets(trip_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_budget_id_idx ON public.budget_breakdowns(budget_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_user_id_idx ON public.budget_breakdowns(user_id);
CREATE INDEX IF NOT EXISTS itineraries_trip_id_idx ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS trip_ratings_trip_id_idx ON public.trip_ratings(trip_id);
CREATE INDEX IF NOT EXISTS learning_data_user_id_idx ON public.learning_data(user_id);
CREATE INDEX IF NOT EXISTS expenses_trip_id_idx ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS item_feedback_item_id_type_idx ON public.item_feedback(item_id, item_type);

-- Vector Similarity Search Performance Index (HNSW for Cosine Distance)
CREATE INDEX IF NOT EXISTS travel_memories_embedding_hnsw_idx 
ON public.travel_memories 
USING hnsw (embedding vector_cosine_ops);
