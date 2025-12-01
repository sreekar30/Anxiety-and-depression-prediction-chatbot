// src/config.ts

// Tableau dashboard URLs
export const TABLEAU_DASHBOARD_URL_1: string =
  import.meta.env.VITE_TABLEAU_DASHBOARD_URL_1 || "";

export const TABLEAU_DASHBOARD_URL_2: string =
  import.meta.env.VITE_TABLEAU_DASHBOARD_URL_2 || "";

export const TABLEAU_DASHBOARD_URL_3: string =
  import.meta.env.VITE_TABLEAU_DASHBOARD_URL_3 || "";

// Chat / prediction API
export const CHAT_API_URL: string =
  import.meta.env.VITE_CHAT_API_URL || "";

export const CHAT_API_KEY: string =
  import.meta.env.VITE_CHAT_API_KEY || "";

// OpenAI key for the chatbot logic
export const OPENAI_API_KEY: string =
  import.meta.env.VITE_OPENAI_API_KEY || "";
