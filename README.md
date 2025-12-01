# Mental Health Prediction Web UI

This is a Vite + React + TypeScript + Tailwind CSS project that shows:

- An information section about anxiety and depression
- A facts text carousel
- One embedded Tableau dashboard (combined anxiety/depression view)
- A chatbot section that calls your Hugging Face FastAPI endpoint

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file:

- Copy `.env.example` to `.env`
- Fill in:

```bash
VITE_TABLEAU_DASHBOARD_URL="https://public.tableau.com/views/YourWorkbook/YourDashboard"
VITE_CHAT_API_URL="https://nmanluko-mhealth.hf.space/predict"
VITE_CHAT_API_KEY=""
```

3. Run the dev server:

```bash
npm run dev
```

4. Open the printed URL (usually `http://localhost:5173`).

## Connecting to your APIs

- **Tableau**: make sure your dashboard is published and accessible by the users
  who will view this page. Use the *Share* link from Tableau Public as the
  `VITE_TABLEAU_DASHBOARD_URL` value.

- **Chatbot**: the frontend sends a POST request to `VITE_CHAT_API_URL` with a
  JSON body that looks like:

```json
{ "message": "User text here" }
```

and expects a response shaped like:

```json
{
  "reply": "Model answer text",
  "anxiety_score": 0.7,
  "depression_score": 0.4
}
```

If your API uses a different field name or structure, adjust the code in
`src/components/ChatbotSection.tsx` where the request body is created and
where the response is parsed.
