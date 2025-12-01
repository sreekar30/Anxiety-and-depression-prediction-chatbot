// src/components/ChatbotSection.tsx


import React, { useEffect, useRef, useState } from "react";
import { CHAT_API_URL, CHAT_API_KEY, OPENAI_API_KEY } from "../config";

type Role = "user" | "assistant";

type FeatureId =
  | "AGEP_A"
  | "SEX_A"
  | "EDUCP_A"
  | "REGION"
  | "URBRRL23"
  | "PCNTADLT_A"
  | "PCNTKIDS_A"
  | "LEGMSTAT_A"
  | "PHSTAT_A"
  | "BMICAT_A"
  | "DRKSTAT_A"
  | "SLPHOURS_A"
  | "SUPPORT_A"
  | "SLPFLL_A"
  | "LONELY_A"
  | "LSATIS4_A";

interface ChatMessage {
  role: Role;
  text: string;
  featureId?: FeatureId;
  isQuestion?: boolean;
}

type Phase = "intro" | "collecting" | "review" | "after_prediction";

const featureOrder: FeatureId[] = [
  "AGEP_A",
  "SEX_A",
  "EDUCP_A",
  "REGION",
  "URBRRL23",
  "PCNTADLT_A",
  "PCNTKIDS_A",
  "LEGMSTAT_A",
  "PHSTAT_A",
  "BMICAT_A",
  "DRKSTAT_A",
  "SLPHOURS_A",
  "SUPPORT_A",
  "SLPFLL_A",
  "LONELY_A",
  "LSATIS4_A",
];

// ---------- feature schemas ----------

interface BaseSchema {
  id: FeatureId;
  featureKey: FeatureId;
  label: string;
  question: string;
  info?: string;
  type: "numeric" | "categorical";
}

interface NumericSchema extends BaseSchema {
  type: "numeric";
  min?: number;
  max?: number;
  unitHint?: string;
}

interface CategoricalOption {
  code: number;
  label: string;
  aliases: string[];
}

interface CategoricalSchema extends BaseSchema {
  type: "categorical";
  options: CategoricalOption[];
}

type FeatureSchema = NumericSchema | CategoricalSchema;

const featureSchemas: Record<FeatureId, FeatureSchema> = {
  // ---- Age ----
  AGEP_A: {
    id: "AGEP_A",
    featureKey: "AGEP_A",
    label: "age",
    type: "numeric",
    question:
      "Let's start. How old are you (in years)? Please type a number between 18 and 100.",
    min: 18,
    max: 100,
    unitHint: "years",
  },

  


  // ---- Sex ----
  SEX_A: {
    id: "SEX_A",
    featureKey: "SEX_A",
    label: "sex",
    type: "categorical",
    question:
      "How would you describe your biological sex? You can type the number or the phrase.",
    options: [
      { code: 1, label: "Male", aliases: ["male", "man", "boy", "guy", "m"] },
      {
        code: 2,
        label: "Female",
        aliases: ["female", "woman", "girl", "f"],
      },
    ],
  },

  // ---- Education ----
  EDUCP_A: {
    id: "EDUCP_A",
    featureKey: "EDUCP_A",
    label: "education level",
    type: "categorical",
    question:
      "What is the highest level of education you've completed? You can type the number or the phrase.",
    options: [
      {
        code: 1,
        label: "No schooling completed",
        aliases: ["no schooling", "no school", "none"],
      },
      {
        code: 2,
        label: "1st–8th grade",
        aliases: ["primary school", "elementary", "1 to 8", "middle school"],
      },
      {
        code: 3,
        label: "9th–11th grade (no diploma)",
        aliases: ["9th", "10th", "11th", "some high school"],
      },
      {
        code: 4,
        label: "High school graduate or GED",
        aliases: ["high school", "hs", "ged", "secondary school"],
      },
      {
        code: 5,
        label: "Some college, no degree",
        aliases: ["some college", "college but no degree"],
      },
      {
        code: 6,
        label: "Associate degree (AA, AS)",
        aliases: ["associate degree", "aa degree", "as degree"],
      },
      {
        code: 7,
        label: "Bachelor’s degree (BA, BS)",
        aliases: ["bachelor", "bachelors", "ba", "bs", "undergraduate"],
      },
      {
        code: 8,
        label: "Master’s degree",
        aliases: ["masters", "master's", "msc", "ma", "ms"],
      },
      {
        code: 9,
        label: "Professional school degree (MD, JD, etc.)",
        aliases: ["professional degree", "md", "jd", "law degree", "medical"],
      },
      {
        code: 10,
        label: "Doctoral degree (PhD, EdD, etc.)",
        aliases: ["phd", "doctorate", "doctoral", "edd"],
      },
    ],
  },

  // ---- REGION ----
  REGION: {
    id: "REGION",
    featureKey: "REGION",
    label: "U.S. region",
    type: "categorical",
    question:
      "Which region of the United States do you currently live in? You can type the number or the phrase.",
    info:
      "This is a broad region, not your exact state or address:\n\n" +
      "• Northeast – e.g., NY, MA, PA\n" +
      "• Midwest – e.g., IL, OH, MI\n" +
      "• South – e.g., TX, FL, GA\n" +
      "• West – e.g., CA, WA, AZ",
    options: [
      { code: 1, label: "Northeast", aliases: ["northeast", "ne"] },
      { code: 2, label: "Midwest", aliases: ["midwest", "mw"] },
      { code: 3, label: "South", aliases: ["south"] },
      { code: 4, label: "West", aliases: ["west"] },
    ],
  },

  // ---- URBRRL23 ----
  URBRRL23: {
    id: "URBRRL23",
    featureKey: "URBRRL23",
    label: "urban/rural area type",
    type: "categorical",
    question:
      "Which best describes the type of area you live in? You can type the number or the phrase.",
    info:
      "These options are based on the NCHS Urban–Rural classification:\n\n" +
      "• Large central metro – big cities and downtown areas.\n" +
      "• Large fringe metro – suburbs of large cities.\n" +
      "• Medium and small metro – smaller cities.\n" +
      "• Nonmetropolitan – towns or rural areas outside metro regions.",
    options: [
      {
        code: 1,
        label: "Large central metro",
        aliases: ["large central metro", "big city center", "downtown area"],
      },
      {
        code: 2,
        label: "Large fringe metro",
        aliases: ["large fringe metro", "suburbs of big city", "outer city"],
      },
      {
        code: 3,
        label: "Medium and small metro",
        aliases: [
          "medium metro",
          "small metro",
          "smaller city",
          "medium and small metro",
        ],
      },
      {
        code: 4,
        label: "Nonmetropolitan",
        aliases: ["nonmetropolitan", "rural", "small town", "countryside"],
      },
    ],
  },

  // ---- PCNTADLT_A ----
  PCNTADLT_A: {
    id: "PCNTADLT_A",
    featureKey: "PCNTADLT_A",
    label: "number of adults in household",
    type: "categorical",
    question:
      "Including you, how many adults live in your household? You can type the number or the phrase.",
    options: [
      { code: 1, label: "1 adult", aliases: ["1 adult", "just me", "only me"] },
      {
        code: 2,
        label: "2 adults",
        aliases: ["2 adults", "two adults"],
      },
      {
        code: 3,
        label: "3+ adults",
        aliases: ["3 adults", "3+ adults", "three or more adults"],
      },
    ],
  },

  // ---- PCNTKIDS_A ----
  PCNTKIDS_A: {
    id: "PCNTKIDS_A",
    featureKey: "PCNTKIDS_A",
    label: "number of children in household",
    type: "categorical",
    question:
      "How many children live in your household? You can type the number or the phrase.",
    options: [
      { code: 0, label: "0 children", aliases: ["none", "zero"] },
      {
        code: 1,
        label: "1 child",
        aliases: ["1 child", "one child"],
      },
      {
        code: 2,
        label: "2 children",
        aliases: ["two children", "2 children"],
      },
      {
        code: 3,
        label: "3+ children",
        aliases: ["three or more", "3+ children", "three children or more"],
      },
    ],
  },

  // ---- LEGMSTAT_A ----
  LEGMSTAT_A: {
    id: "LEGMSTAT_A",
    featureKey: "LEGMSTAT_A",
    label: "marital status",
    type: "categorical",
    question:
      "What is your current marital status? You can type the number or the phrase.",
    options: [
      { code: 1, label: "Married", aliases: ["married", "spouse"] },
      { code: 2, label: "Widowed", aliases: ["widowed", "widow", "widower"] },
      { code: 3, label: "Divorced", aliases: ["divorced"] },
      { code: 4, label: "Separated", aliases: ["separated"] },
      {
        code: 5,
        label: "Never married",
        aliases: ["single", "never married", "not married"],
      },
    ],
  },

  // ---- PHSTAT_A ----
  PHSTAT_A: {
    id: "PHSTAT_A",
    featureKey: "PHSTAT_A",
    label: "physical health",
    type: "categorical",
    question:
      "Overall, how would you rate your physical health? You can type the number or the phrase.",
    info:
      "Physical health means how your body usually feels day to day — your energy, pain, mobility, and how easily you can do everyday activities.\n\n" +
      "• Excellent – You feel very energetic, almost never have pain, illness, or limits in what you can do.\n" +
      "• Very good – You feel well most of the time, with only small or occasional problems.\n" +
      "• Good – You generally feel okay, but you sometimes have pain, tiredness, or limits.\n" +
      "• Fair – You often have pain, fatigue, or health problems that affect daily life.\n" +
      "• Poor – Your health regularly makes it hard to do normal activities.",
    options: [
      { code: 1, label: "Excellent", aliases: ["excellent", "great health"] },
      { code: 2, label: "Very good", aliases: ["very good", "really good"] },
      {
        code: 3,
        label: "Good",
        aliases: ["good", "okay", "ok", "fine"],
      },
      {
        code: 4,
        label: "Fair",
        aliases: ["fair", "not great", "so so", "so-so"],
      },
      { code: 5, label: "Poor", aliases: ["poor", "bad", "very bad"] },
    ],
  },

  // ---- BMICAT_A ----
  BMICAT_A: {
    id: "BMICAT_A",
    featureKey: "BMICAT_A",
    label: "weight category",
    type: "categorical",
    question:
      "Which best describes your body weight category? You can type the number or the phrase.",
    info:
      "These options are based on BMI (Body Mass Index), which compares your weight to your height:\n\n" +
      "• Underweight – Below the typical range for your height.\n" +
      "• Healthy weight – In the typical range for your height.\n" +
      "• Overweight – Above the typical range for your height.\n" +
      "• Obese – Well above the typical range for your height.\n\n" +
      "You don’t need to know your exact BMI — just choose the option that feels closest to how you’d usually describe your body.",
    options: [
      {
        code: 1,
        label: "Underweight",
        aliases: [
          "underweight",
          "under weight",
          "under",
          "very thin",
          "really thin",
        ],
      },
      {
        code: 2,
        label: "Healthy weight",
        aliases: ["healthy", "normal", "normal weight", "average"],
      },
      {
        code: 3,
        label: "Overweight",
        aliases: ["overweight", "over weight", "over", "a bit heavy"],
      },
      {
        code: 4,
        label: "Obese",
        aliases: ["obese", "very overweight", "really heavy"],
      },
    ],
  },

  // ---- DRKSTAT_A ----
  DRKSTAT_A: {
    id: "DRKSTAT_A",
    featureKey: "DRKSTAT_A",
    label: "alcohol use",
    type: "categorical",
    question:
      "Which best describes your alcohol use? You can type the number or the phrase.",
    options: [
      {
        code: 1,
        label: "I never drink alcohol (lifetime abstainer).",
        aliases: ["never", "never drink", "don't drink", "no alcohol", "abstain"],
      },
      {
        code: 2,
        label: "I used to drink but I do not drink now.",
        aliases: [
          "used to drink",
          "former drinker",
          "i used to",
          "stopped drinking",
          "quit drinking",
          "used to",
        ],
      },
      {
        code: 3,
        label: "I currently drink lightly or occasionally.",
        aliases: [
          "lightly",
          "occasionally",
          "socially",
          "light drinker",
          "now and then",
          "sometimes",
        ],
      },
      {
        code: 4,
        label: "I currently drink quite a lot or heavily.",
        aliases: [
          "heavily",
          "quite a lot",
          "heavy drinker",
          "drink a lot",
          "binge drink",
        ],
      },
    ],
  },

  // ---- SLPHOURS_A ----
  SLPHOURS_A: {
    id: "SLPHOURS_A",
    featureKey: "SLPHOURS_A",
    label: "sleep hours",
    type: "numeric",
    question:
      "On average, how many hours do you sleep per night? Please type a number between 3 and 14.",
    min: 3,
    max: 14,
    unitHint: "hours per night",
  },

  // ---- SUPPORT_A ----
  SUPPORT_A: {
    id: "SUPPORT_A",
    featureKey: "SUPPORT_A",
    label: "emotional support",
    type: "categorical",
    question:
      "How often do you feel you have someone you can rely on for emotional support? You can type the number or the phrase.",
    info:
      "Think about friends, family, or others you can talk to when you’re stressed or upset.",
    options: [
      {
        code: 1,
        label: "Always",
        aliases: ["always", "all the time"],
      },
      {
        code: 2,
        label: "Usually",
        aliases: ["usually", "most of the time"],
      },
      {
        code: 3,
        label: "Sometimes",
        aliases: ["sometimes", "occasionally"],
      },
      {
        code: 4,
        label: "Rarely",
        aliases: ["rarely", "almost never"],
      },
      {
        code: 5,
        label: "Never",
        aliases: ["never"],
      },
    ],
  },

  // ---- SLPFLL_A ----
  SLPFLL_A: {
    id: "SLPFLL_A",
    featureKey: "SLPFLL_A",
    label: "how refreshed you feel after sleep",
    type: "categorical",
    question:
      "After you sleep, how refreshed do you usually feel? You can type the number or the phrase.",
    info:
      "Try to think about most days, not just one bad or good night:\n\n" +
      "• Not at all refreshed – You wake up exhausted or drained, like you hardly rested.\n" +
      "• A little refreshed – You feel only a bit better after sleep, still somewhat tired.\n" +
      "• Fairly refreshed – You feel okay and able to function, with some energy.\n" +
      "• Very refreshed – You wake up feeling clear, energetic, and well-rested.",
    options: [
      {
        code: 1,
        label: "Not at all refreshed",
        aliases: ["not at all", "not refreshed", "exhausted", "very tired"],
      },
      {
        code: 2,
        label: "A little refreshed",
        aliases: ["a little", "a little refreshed", "slightly", "a bit"],
      },
      {
        code: 3,
        label: "Fairly refreshed",
        aliases: ["fairly", "fairly refreshed", "pretty refreshed", "okay"],
      },
      {
        code: 4,
        label: "Very refreshed",
        aliases: [
          "very refreshed",
          "fully refreshed",
          "really refreshed",
          "energetic",
        ],
      },
    ],
  },

  // ---- LONELY_A ----
  LONELY_A: {
    id: "LONELY_A",
    featureKey: "LONELY_A",
    label: "loneliness",
    type: "categorical",
    question:
      "How often do you feel lonely? You can type the number or the phrase.",
    info:
      "Think about the last few weeks. This is about how often you feel emotionally alone or disconnected from others.",
    options: [
      { code: 1, label: "Never", aliases: ["never"] },
      {
        code: 2,
        label: "Rarely",
        aliases: ["rarely", "almost never", "not often"],
      },
      {
        code: 3,
        label: "Sometimes",
        aliases: ["sometimes", "occasionally", "now and then"],
      },
      {
        code: 4,
        label: "Often",
        aliases: ["often", "a lot", "frequently"],
      },
      {
        code: 5,
        label: "Always or almost always",
        aliases: ["always", "almost always", "all the time"],
      },
    ],
  },

  // ---- LSATIS4_A ----
  LSATIS4_A: {
    id: "LSATIS4_A",
    featureKey: "LSATIS4_A",
    label: "life satisfaction",
    type: "categorical",
    question:
      "Overall, how satisfied are you with your life right now? You can type the number or the phrase.",
    options: [
      {
        code: 1,
        label: "Very satisfied",
        aliases: [
          "very satisfied",
          "really satisfied",
          "extremely satisfied",
          "very happy",
          "loving my life",
        ],
      },
      {
        code: 2,
        label: "Satisfied",
        aliases: ["satisfied", "pretty satisfied", "happy", "it's fine"],
      },
      {
        code: 3,
        label: "Dissatisfied",
        aliases: ["dissatisfied", "unhappy", "not satisfied", "not happy"],
      },
      {
        code: 4,
        label: "Very dissatisfied",
        aliases: [
          "very dissatisfied",
          "really unhappy",
          "miserable",
          "very unhappy",
          "hate my life",
        ],
      },
    ],
  },
};

// ---------- OpenAI helper ----------



const mentalHealthSystemPrompt = {
  role: "system" as const,
  content: `
You are "MIND Companion", a calm, supportive mental health AI focused ONLY on
depression, anxiety, stress, and emotional wellbeing. 

Rules:
- You ONLY answer questions related to mental health, mood, coping, self-care, relationships, or interpreting the prediction results.
- If the user asks about anything unrelated (math, coding, politics, etc.), politely decline and say you are a mental health chatbot.
- You are NOT a doctor and do not give diagnoses or medication advice.
- Always encourage reaching out to licensed professionals for serious or ongoing concerns.
- If a user seems in crisis or talks about self-harm, encourage them to contact local emergency services or a trusted person immediately.
- Use warm, simple language. Answer in short paragraphs, not long walls of text.`,
};

async function callOpenAI(
  messages: { role: "system" | "user"; content: string }[]
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "I can't reach the language model right now because no OpenAI API key is configured.";
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("OpenAI error:", data);
      return "I'm having trouble thinking right now. Please try again in a moment.";
    }
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string"
      ? content.trim()
      : "I'm having trouble thinking right now. Please try again in a moment.";
  } catch (err) {
    console.error("OpenAI fetch error:", err);
    return "I'm having trouble connecting at the moment. Please try again in a bit.";
  }
}




// ---------- local helpers ----------

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return isNaN(n) ? null : n;
}

function interpretNumeric(
  schema: NumericSchema,
  userText: string
): { value: number } | null {
  const n = extractFirstNumber(userText);
  if (n === null) return null;
  if (
    (schema.min !== undefined && n < schema.min) ||
    (schema.max !== undefined && n > schema.max)
  ) {
    return null;
  }
  return { value: n };
}

function interpretCategorical(
  schema: CategoricalSchema,
  userText: string
): { value: number; label: string; interpreted: boolean } | null {
  const lower = normalize(userText);

  const num = extractFirstNumber(userText);
  if (num !== null) {
    const idx = Math.round(num) - 1;
    if (idx >= 0 && idx < schema.options.length) {
      const chosen = schema.options[idx];
      return { value: chosen.code, label: chosen.label, interpreted: false };
    }
  }

  for (const opt of schema.options) {
    const labelLow = normalize(opt.label);
    if (lower === labelLow || lower.includes(labelLow)) {
      return { value: opt.code, label: opt.label, interpreted: false };
    }
  }

  for (const opt of schema.options) {
    for (const alias of opt.aliases) {
      const aliasLow = normalize(alias);
      if (lower === aliasLow || lower.includes(aliasLow)) {
        return { value: opt.code, label: opt.label, interpreted: true };
      }
    }
  }

  return null;
}

interface PredictionResult {
  depression_probability?: number;
  anxiety_probability?: number;
}

function formatPercentage(p?: number): string {
  if (p === undefined || p === null || isNaN(p)) return "N/A";
  const pct = Math.round(p * 1000) / 10;
  return `${pct.toFixed(1)}%`;
}

function buildSuggestionText(result: PredictionResult): string {
  const d = result.depression_probability ?? 0;
  const a = result.anxiety_probability ?? 0;
  const maxProb = Math.max(d, a);

  if (maxProb < 0.25) {
    return (
      "These scores suggest a low chance of strong depression or anxiety right now. " +
      "Still, it’s good to keep taking care of your sleep, movement, and social connections."
    );
  }
  if (maxProb < 0.5) {
    return (
      "These scores suggest a mild chance of depression or anxiety. " +
      "Notice how your mood changes over time. Simple habits like regular sleep, gentle exercise, and talking with someone you trust can help."
    );
  }
  if (maxProb < 0.75) {
    return (
      "These scores suggest a moderate chance of depression or anxiety. " +
      "If these feelings are bothering you, consider talking to a counselor, therapist, or doctor. " +
      "You don’t have to handle it all alone."
    );
  }
  return (
    "These scores suggest a higher chance of depression or anxiety. " +
    "If you feel very low, very anxious, or overwhelmed, please reach out to a mental health professional or a trusted person soon. " +
    "Getting support is a strong and important step."
  );
}

// ---------- main component ----------

const ChatbotSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [featureIndex, setFeatureIndex] = useState<number>(-1);
  const [collected, setCollected] = useState<Record<string, number>>({});
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [hoveredInfoFeatureId, setHoveredInfoFeatureId] =
    useState<FeatureId | null>(null);
  const [editingFeatureId, setEditingFeatureId] = useState<FeatureId | null>(
    null
  );

  const chatSectionRef = useRef<HTMLElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const introMessages: ChatMessage[] = [
    {
      role: "assistant",
      text:
        "Hi, I'm MIND Companion — a mental health chatbot focused on depression and anxiety.",
    },
    {
      role: "assistant",
      text:
        "I can walk you through a quick prediction based on your lifestyle and wellbeing, and I can also answer questions about how you're feeling.",
    },
    {
      role: "assistant",
      text:
        "Would you like to start the depression/anxiety prediction now?",
    },
  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(introMessages);
      setPhase("intro");
      setFeatureIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll inside the chat box to the latest message
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isPredicting]);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  
    // On mobile, when the assistant asks a new question,
    // gently scroll the *page* so the chat stays in view.
    if (
      msg.role === "assistant" &&
      msg.isQuestion &&
      typeof window !== "undefined" &&
      window.innerWidth < 768 // only phones / small screens
    ) {
      // Wait a moment so layout settles, then scroll
      setTimeout(() => {
        const sectionEl = chatSectionRef.current;
        if (!sectionEl) return;
  
        sectionEl.scrollIntoView({
          behavior: "smooth",
          block: "center", // center the chat section in the viewport
        });
      }, 150);
    }
  };
  

  const resetChat = () => {
    setMessages(introMessages);
    setPhase("intro");
    setFeatureIndex(-1);
    setCollected({});
    setLastPrediction(null);
    setHasPredicted(false);
    setInput("");
    setLoading(false);
    setIsPredicting(false);
    setHoveredInfoFeatureId(null);
    setEditingFeatureId(null);
  };

  const askMentalHealthAgent = async (
    userText: string,
    extraInstruction = ""
  ) => {
    setLoading(true);
    const reply = await callOpenAI([
      mentalHealthSystemPrompt,
      {
        role: "user",
        content: `
User message: "${userText}"

${extraInstruction}
If the question is unrelated to mental health, politely decline and remind them you're a mental health chatbot.`,
      },
    ]);
    addMessage({ role: "assistant", text: reply });
    setLoading(false);
  };

  const currentFeatureId = (): FeatureId | null => {
    if (editingFeatureId) return editingFeatureId;
    if (featureIndex < 0 || featureIndex >= featureOrder.length) return null;
    return featureOrder[featureIndex];
  };

  const askQuestionForFeature = (fid: FeatureId) => {
    const schema = featureSchemas[fid];
    const lines: string[] = [];
    lines.push(schema.question);

    if (schema.type === "categorical") {
      const cat = schema as CategoricalSchema;
      cat.options.forEach((opt, idx) => {
        lines.push(`${idx + 1}. ${opt.label}`);
      });
      lines.push("You can reply with the number or a short phrase.");
    } else if (schema.type === "numeric" && schema.unitHint) {
      lines.push(`You can reply with a number (${schema.unitHint}).`);
    }

    addMessage({
      role: "assistant",
      text: lines.join("\n"),
      featureId: fid,
      isQuestion: true,
    });
  };

  const beginQuestionnaire = () => {
    setPhase("collecting");
    setFeatureIndex(0);
    setCollected({});
    setHasPredicted(false);
    setLastPrediction(null);
    setEditingFeatureId(null);
    addMessage({
      role: "assistant",
      text:
        "Great, we'll go through a few short questions. Please answer as honestly as you can.",
    });
    askQuestionForFeature(featureOrder[0]);
  };

  const handleChangeLastAnswerCommand = () => {
    if (featureIndex <= 0) {
      addMessage({
        role: "assistant",
        text:
          "We haven't saved any answers yet to change. Let's start with the first question.",
      });
      return;
    }
    const prevIndex = featureIndex - 1;
    const fid = featureOrder[prevIndex];
    setPhase("collecting");
    setEditingFeatureId(fid);
    addMessage({
      role: "assistant",
      text: `No problem, let's update your ${featureSchemas[fid].label}.`,
    });
    askQuestionForFeature(fid);
  };

  const sendToFastAPI = async () => {
    if (hasPredicted) return;
    setHasPredicted(true);

    if (!CHAT_API_URL) {
      addMessage({
        role: "assistant",
        text:
          "The prediction service is not configured yet (CHAT_API_URL missing). Please contact the developer.",
      });
      return;
    }

    setIsPredicting(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(CHAT_API_KEY ? { Authorization: `Bearer ${CHAT_API_KEY}` } : {}),
        },
        body: JSON.stringify(collected),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("FastAPI error:", res.status, text);
        addMessage({
          role: "assistant",
          text:
            "I'm sorry, the prediction service had a problem. Please try again later.",
        });
        setIsPredicting(false);
        return;
      }

      const result: PredictionResult = JSON.parse(text);
      setLastPrediction(result);

      const anxietyPct = formatPercentage(result.anxiety_probability);
      const depressionPct = formatPercentage(result.depression_probability);
      const suggestion = buildSuggestionText(result);

      const summaryText =
        `Your prediction scores are:\n\n` +
        `• Anxiety: ${anxietyPct}\n` +
        `• Depression: ${depressionPct}\n\n` +
        `Suggestion: ${suggestion}\n\n` +
        `If you'd like, you can type "restart" or "start again" to go through the questionnaire one more time.`;

      addMessage({ role: "assistant", text: summaryText });
      setPhase("after_prediction");
    } catch (err) {
      console.error("FastAPI fetch error:", err);
      addMessage({
        role: "assistant",
        text:
          "I couldn't reach the prediction service just now. Please try again a bit later.",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const showReviewSummary = () => {
    const lines: string[] = [];
    lines.push("Here’s a quick summary of what I recorded:");

    featureOrder.forEach((fid) => {
      const schema = featureSchemas[fid];
      const val = collected[fid];
      if (val === undefined) return;

      if (schema.type === "numeric") {
        const numSchema = schema as NumericSchema;
        if (numSchema.unitHint) {
          lines.push(`- ${schema.label}: ${val} ${numSchema.unitHint}`);
        } else {
          lines.push(`- ${schema.label}: ${val}`);
        }
      } else {
        const cat = schema as CategoricalSchema;
        const opt = cat.options.find((o) => o.code === val);
        const label = opt ? opt.label : `code ${val}`;
        lines.push(`- ${schema.label}: ${label}`);
      }
    });

    lines.push(
      "\nIf you'd like to change anything, you can say things like:\n" +
        '- "change my last answer"\n' +
        '- "change my sleep hours" or "edit my life satisfaction"\n\n' +
        'When everything looks right, you can type "confirm", "ok", or "looks good" and I’ll run the prediction.'
    );

    addMessage({ role: "assistant", text: lines.join("\n") });
  };

  const handleEditByName = (textLower: string): boolean => {
    const mapping: { keywords: string[]; feature: FeatureId }[] = [
      { keywords: ["age"], feature: "AGEP_A" },
      { keywords: ["sex", "gender"], feature: "SEX_A" },
      { keywords: ["education", "school"], feature: "EDUCP_A" },
      { keywords: ["region"], feature: "REGION" },
      { keywords: ["urban", "rural", "metro"], feature: "URBRRL23" },
      { keywords: ["adults"], feature: "PCNTADLT_A" },
      { keywords: ["children", "kids"], feature: "PCNTKIDS_A" },
      { keywords: ["marital", "married", "relationship"], feature: "LEGMSTAT_A" },
      { keywords: ["physical health", "health"], feature: "PHSTAT_A" },
      { keywords: ["weight", "bmi"], feature: "BMICAT_A" },
      { keywords: ["drink", "alcohol"], feature: "DRKSTAT_A" },
      { keywords: ["sleep hours", "sleep"], feature: "SLPHOURS_A" },
      { keywords: ["support"], feature: "SUPPORT_A" },
      { keywords: ["refreshed", "sleep quality"], feature: "SLPFLL_A" },
      { keywords: ["lonely", "loneliness"], feature: "LONELY_A" },
      { keywords: ["life satisfaction", "satisfied"], feature: "LSATIS4_A" },
    ];

    for (const entry of mapping) {
      if (entry.keywords.some((k) => textLower.includes(k))) {
        const idx = featureOrder.indexOf(entry.feature);
        if (idx === -1) break;
        setPhase("collecting");
        setEditingFeatureId(entry.feature);
        addMessage({
          role: "assistant",
          text: `Sure, let's update your ${featureSchemas[entry.feature].label}.`,
        });
        askQuestionForFeature(entry.feature);
        return true;
      }
    }
    return false;
  };

  const handleUserMessageCollecting = (text: string) => {
    const fid = currentFeatureId();
    if (!fid) return;

    const schema = featureSchemas[fid];

    const lower = normalize(text);
    if (lower.includes("change my last answer")) {
      handleChangeLastAnswerCommand();
      return;
    }

    let interpretedNumeric: { value: number } | null = null;
    let interpretedCat:
      | { value: number; label: string; interpreted: boolean }
      | null = null;

    if (schema.type === "numeric") {
      interpretedNumeric = interpretNumeric(schema as NumericSchema, text);
      if (!interpretedNumeric) {
        addMessage({
          role: "assistant",
          text:
            "I couldn't find a clear number in that. Could you reply with a single number for this question?",
        });
        return;
      }
    } else {
      interpretedCat = interpretCategorical(schema as CategoricalSchema, text);
      if (!interpretedCat) {
        addMessage({
          role: "assistant",
          text:
            "I couldn't match that answer to one of the options. Please type the number or a short phrase that fits best.",
        });
        return;
      }
    }

    const value =
      schema.type === "numeric"
        ? interpretedNumeric!.value
        : interpretedCat!.value;

    setCollected((prev) => ({ ...prev, [fid]: value }));

    if (
      schema.type === "categorical" &&
      interpretedCat &&
      interpretedCat.interpreted
    ) {
      addMessage({
        role: "assistant",
        text: `I'll interpret your answer as: "${interpretedCat.label}". If that's not right, please type "change my last answer".`,
      });
    }

    // If we were editing a past answer, go back to review after saving
    if (editingFeatureId) {
      setEditingFeatureId(null);
      setPhase("review");
      showReviewSummary();
      return;
    }

    // Normal forward flow
    const nextIndex = featureIndex + 1;
    if (nextIndex < featureOrder.length) {
      setFeatureIndex(nextIndex);
      askQuestionForFeature(featureOrder[nextIndex]);
    } else {
      setPhase("review");
      setFeatureIndex(featureOrder.length);
      showReviewSummary();
    }
  };

  const handleUserMessageReview = (text: string) => {
    const lower = normalize(text);

    if (
      lower === "confirm" ||
      lower.includes("looks good") ||
      lower === "ok" ||
      lower === "okay" ||
      lower.includes("go ahead") ||
      lower.includes("yes")
    ) {
      sendToFastAPI();
      return;
    }

    if (lower.includes("change my last answer")) {
      handleChangeLastAnswerCommand();
      return;
    }

    if (handleEditByName(lower)) return;

    void askMentalHealthAgent(text);
  };

  const handleUserMessageAfterPrediction = (text: string) => {
    const lower = normalize(text);
    if (lower.includes("start again") || lower.includes("restart")) {
      resetChat();
      return;
    }

    void askMentalHealthAgent(
      text,
      lastPrediction
        ? `If helpful, you can refer to their previous prediction: ${JSON.stringify(
            lastPrediction
          )}`
        : ""
    );
  };

  const handleUserMessageIntro = (text: string) => {
    const lower = normalize(text);
    if (
      lower.includes("yes") ||
      lower.includes("start") ||
      lower.includes("ok") ||
      lower.includes("sure") ||
      lower.includes("begin")
    ) {
      beginQuestionnaire();
    } else {
      void askMentalHealthAgent(text);
    }
  };

  const handleUserMessage = (text: string) => {
    if (phase === "intro") {
      handleUserMessageIntro(text);
    } else if (phase === "collecting") {
      handleUserMessageCollecting(text);
    } else if (phase === "review") {
      handleUserMessageReview(text);
    } else {
      handleUserMessageAfterPrediction(text);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    addMessage({ role: "user", text });
    setLoading(true);
    await Promise.resolve(handleUserMessage(text));
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // ---------- JSX ----------


return (
  <section
    id="chatbot"
    ref={chatSectionRef}
    className="mx-auto max-w-6xl px-4 py-10 md:py-14 border-t border-slate-800 animate-fadeInUp"
  >

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1 bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent heading-glow">
            Mental Health Chatbot
          </h2>
          <p className="text-slate-700 text-sm md:text-base">
          This chatbot guides you through a short questionnaire, followed by a depression/anxiety prediction based on your responses. It is not a complete replacement for professional care or support. 
          </p>
        </div>
        <button
          onClick={resetChat}
          className="rounded-full border border-sky-400/60 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-slate-800 transition shadow-md shadow-slate-900/60"
        >
          ↺ Restart questionnaire
        </button>
      </div>

      <div className="bg-slate-950/80 rounded-2xl shadow-xl border border-slate-800 flex flex-col min-h-[420px] max-h-[65vh] md:h-[500px] backdrop-blur-xl">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-emerald-400 shadow-md" />
            <div>
              <div className="text-sm font-semibold text-slate-50">
                MIND Companion
              </div>
              <div className="text-xs text-slate-400">
                Depression &amp; Anxiety Support Agent
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.3)]" />
            <span className="text-xs text-slate-400">Online</span>
          </div>
        </div>

        {/* messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          ref={messagesContainerRef}
        >
          {messages.map((msg, idx) => {
            const isQuestion =
              msg.role === "assistant" && msg.isQuestion && msg.featureId;
            const schema =
              isQuestion && msg.featureId
                ? featureSchemas[msg.featureId]
                : undefined;

            const isInfoShown =
              !!schema &&
              !!schema.info &&
              hoveredInfoFeatureId === msg.featureId;

            return (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-400 text-slate-900 rounded-br-sm"
                      : "bg-slate-900/90 text-slate-100 border border-slate-700 rounded-bl-sm"
                  }`}
                >
                  {isQuestion && schema ? (
                    (() => {
                      const [firstLine, ...rest] = msg.text.split("\n");
                      return (
                        <div className="space-y-1">
                          {/* question row + i icon */}
                          <div className="flex items-center gap-1">
                            <span className="leading-relaxed">
                              {firstLine}
                            </span>
                            {schema.info && (
                              <div
                                className="relative"
                                onMouseEnter={() =>
                                  setHoveredInfoFeatureId(msg.featureId!)
                                }
                                onMouseLeave={() =>
                                  setHoveredInfoFeatureId((prev) =>
                                    prev === msg.featureId ? null : prev
                                  )
                                }
                              >
                                <span
                                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-400 text-[10px] text-sky-300 hover:bg-sky-500/20 transition cursor-default"
                                  aria-label="More information"
                                >
                                  i
                                </span>

                                {isInfoShown && (
                                  <div className="absolute left-4 top-5 z-30 w-80 sm:w-96 max-w-xs sm:max-w-xl rounded-md bg-slate-900/95 p-3 text-[11px] text-slate-100 shadow-lg border border-slate-700 whitespace-pre-line max-h-48 overflow-y-auto">
                                    {schema.info}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* remaining lines (options / helper text) */}
                          {rest.length > 0 && (
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {rest.join("\n")}
                            </p>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[60%] rounded-2xl px-3 py-2 text-sm bg-slate-900/90 text-slate-100 border border-slate-700 rounded-bl-sm flex items-center gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          {isPredicting && (
            <div className="mt-2">
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/3 bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 animate-loading-bar" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Calculating your depression and anxiety probabilities…
              </p>
            </div>
          )}
        </div>

        {/* input + start button */}
        <div className="border-t border-slate-800 bg-slate-900/90 rounded-b-2xl p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <button
              onClick={beginQuestionnaire}
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-900 text-xs font-semibold px-4 py-2 shadow-md shadow-emerald-700/60 hover:bg-emerald-300 transition md:self-start"
            >
              ▶ Start questionnaire
            </button>
            <div className="flex-1 flex gap-2">
              <textarea
                className="flex-1 resize-none rounded-xl border border-slate-600 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="self-end rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white disabled:bg-indigo-300 shadow-md shadow-indigo-800/60 hover:bg-indigo-500 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-3">
      Please call your local emergency services or an urgent helpline if you are experiencing immediate anxiety or are considering self-harm.
      </p>
    </section>
  );
};

export default ChatbotSection;
