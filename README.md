# Aura: An AI-Powered Travel Guide 🌍✨

Aura is a next-generation, AI-driven travel planning and consultancy platform designed to revolutionize how you explore the world. By combining advanced machine learning, multiple AI models (Gemini, Grok), and real-time destination intelligence, Aura acts as your personalized travel co-pilot, creating highly optimized, budget-aware, and tailored travel itineraries.

## 🚀 Key Features

*   **Intelligent Trip Planning:** Generates comprehensive, day-by-day itineraries tailored to your preferences, travel style, and group dynamics.
*   **Budget Prediction & Simulation:** Utilizes ML (XGBoost) and historical data to predict travel costs, simulate budget scenarios, and track expenses in real-time.
*   **Personalization Engine:** Adapts recommendations based on user feedback, past trips, and a unique "Travel DNA" profile.
*   **Real-time Destination Intelligence:** Integrates with Google Maps and live data sources to provide up-to-date information on places, activities, and local conditions.
*   **Activity Recommendation Engine:** Suggests highly relevant activities, dining, and sightseeing options using semantic matching and AI.
*   **Travel Risk Assessment:** Evaluates potential risks for destinations to ensure a safe and smooth journey.
*   **Multi-Plan Generation:** Don't like the first option? Aura can instantly generate alternative itineraries for you to compare.

## 🛠️ Tech Stack

### Frontend
*   **React + Vite:** For a blazing-fast, modern single-page application experience.
*   **Tailwind CSS & shadcn/ui:** For a beautiful, responsive, and highly customizable user interface.
*   **Google Maps API:** For interactive maps, place searching, and route visualization.

### Backend & Infrastructure
*   **Supabase:** Powers the core infrastructure, including:
    *   PostgreSQL Database with `pgvector` for semantic search and AI memory.
    *   Authentication & Authorization.
    *   Storage and edge functions.
*   **AI Integration:**
    *   **Google Gemini & xAI Grok:** For natural language processing, complex reasoning, and content generation.
    *   **Machine Learning Pipeline:** Custom ML infrastructure for data collection, performance monitoring, and synthetic data generation.

## 📂 Project Structure

*   `/src/components`: UI components, including dashboards, Google Maps integrations, and reusable `shadcn/ui` elements.
*   `/src/services`: The brain of the application. Contains all AI engines, budget simulators, recommendation logic, and Supabase client/server interactions.
*   `/src/routes`: Application routing logic (using a file-based router like TanStack Router).
*   `/src/stores`: Zustand (or similar) state management stores for app, travel, and auth state.
*   `/src/types`: TypeScript interfaces and type definitions for strong typing across the app.
*   `/supabase/migrations`: SQL migration files defining the database schema, RLS policies, and ML tracking tables.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn or pnpm
*   A Supabase account and project
*   API Keys for Google Maps, Google Gemini, and Grok (optional depending on config)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Midhull/aura-AN-AI-POWERED-TRAVEL-GUIDE.git
    cd aura-AN-AI-POWERED-TRAVEL-GUIDE
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your necessary environment variables (Supabase URL/Anon Key, Google Maps API Key, AI API Keys).

4.  **Database Setup:**
    Link your project to your Supabase instance and run the migrations:
    ```bash
    supabase link --project-ref <your-project-ref>
    supabase db push
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
