// --------------------------------------------
// ChatbotSection.tsx — FINAL FULL VERSION
// --------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import { CHAT_API_URL, CHAT_API_KEY, OPENAI_API_KEY } from "../config";

type Role = "user" | "assistant";

// FASTAPI feature IDs
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

type Phase = "intro" | "collecting" | "review" | "after_prediction" | "restart_prompt";

// Ordered features for questionnaire
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

// ----------------------
// OpenAI mental health bot
// ----------------------
const mentalHealthSystemPrompt = {
  role: "system" as const,
  content: `
You are "MIND Companion", a calm, supportive mental health AI focused ONLY on
depression, anxiety, stress, and emotional wellbeing.

Rules:
- Only answer mental-health related questions.
- Decline unrelated topics (math, programming, politics, etc.)
- Never give medical or medication advice.
- Encourage professional help if symptoms are serious.
- Use warm, supportive, concise language.
`,
};

async function callOpenAI(
  messages: { role: "system" | "user"; content: string }[]
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "I cannot connect to the language model right now because no OpenAI API key is configured.";
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
      console.error("OpenAI Error:", data);
      return "I'm having trouble thinking right now. Please try again.";
    }

    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string"
      ? content.trim()
      : "I'm having trouble thinking right now. Please try again.";
  } catch (err) {
    console.error("OpenAI Fetch Error:", err);
    return "I’m having trouble connecting right now. Please try again.";
  }
}

// ----------------------
// Schema Types
// ----------------------
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

// ----------------------
// Feature Schemas (UPDATED TO MATCH FASTAPI)
// ----------------------
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

  // ---- REGION (US Census regions) ----
  REGION: {
    id: "REGION",
    featureKey: "REGION",
    label: "U.S. region",
    type: "categorical",
    question:
      "Which region of the United States do you currently live in? You can type the number or the phrase.",
    info:
      "These groups are based on standard U.S. Census regions:\n\n" +
      "• Northeast – e.g., NY, MA, PA, NJ.\n" +
      "• Midwest – e.g., IL, OH, MI, MN.\n" +
      "• South – e.g., TX, FL, GA, NC.\n" +
      "• West – e.g., CA, WA, AZ, CO.\n\n" +
      "If you're not sure, just choose the option that sounds closest.",
    options: [
      { code: 1, label: "Northeast", aliases: ["northeast", "ne"] },
      { code: 2, label: "Midwest", aliases: ["midwest", "mw"] },
      { code: 3, label: "South", aliases: ["south"] },
      { code: 4, label: "West", aliases: ["west"] },
    ],
  },

  // ---- URBRRL23 (Urban–rural classification) ----
  URBRRL23: {
    id: "URBRRL23",
    featureKey: "URBRRL23",
    label: "urban–rural area type",
    type: "categorical",
    question:
      "Which best describes the type of area you live in? You can type the number or the phrase.",
    info:
      "This is based on the NCHS Urban–Rural Classification for U.S. counties:\n\n" +
      "• Large central metro – Dense city areas in major metro regions.\n" +
      "• Large fringe metro – Suburbs around large cities.\n" +
      "• Medium and small metro – Smaller cities and surrounding areas.\n" +
      "• Nonmetropolitan – Towns or rural areas outside metro regions.",
    options: [
      {
        code: 1,
        label: "Large central metro",
        aliases: ["large central metro", "city center", "big city"],
      },
      {
        code: 2,
        label: "Large fringe metro",
        aliases: ["large fringe metro", "suburbs", "suburban"],
      },
      {
        code: 3,
        label: "Medium and small metro",
        aliases: ["medium metro", "small metro", "small city"],
      },
      {
        code: 4,
        label: "Nonmetropolitan",
        aliases: ["nonmetropolitan", "rural", "small town"],
      },
    ],
  },

  // ---- PCNTADLT_A (number of adults) ----
  PCNTADLT_A: {
    id: "PCNTADLT_A",
    featureKey: "PCNTADLT_A",
    label: "number of adults in household",
    type: "categorical",
    question:
      "Including you, how many adults (18 or older) live in your household?",
    info:
      "Count adults who usually live in your home:\n\n" +
      "• 1 adult – You live alone.\n" +
      "• 2 adults – You plus one other adult.\n" +
      "• 3+ adults – You plus two or more other adults.\n\n" +
      "We removed the 'Not ascertained' category during data cleaning.",
    options: [
      { code: 1, label: "1 adult", aliases: ["1 adult", "one adult"] },
      { code: 2, label: "2 adults", aliases: ["2 adults", "two adults"] },
      {
        code: 3,
        label: "3+ adults",
        aliases: ["3+ adults", "three or more adults", "many adults"],
      },
    ],
  },

  // ---- PCNTKIDS_A (number of children) ----
  PCNTKIDS_A: {
    id: "PCNTKIDS_A",
    featureKey: "PCNTKIDS_A",
    label: "number of children in household",
    type: "categorical",
    question:
      "How many children (under 18) live in your household? You can type the number or the phrase.",
    info:
      "Count children who usually live in your home:\n\n" +
      "• 0 children – No children live with you.\n" +
      "• 1 child – One child.\n" +
      "• 2 children – Two children.\n" +
      "• 3+ children – Three or more children.\n\n" +
      "We removed the 'Not ascertained' category during data cleaning.",
    options: [
      { code: 0, label: "0 children", aliases: ["0", "no children", "none"] },
      { code: 1, label: "1 child", aliases: ["1 child", "one child"] },
      { code: 2, label: "2 children", aliases: ["2 children", "two children"] },
      {
        code: 3,
        label: "3+ children",
        aliases: ["3+ children", "three or more children", "many children"],
      },
    ],
  },

  // ---- LEGMSTAT_A (marital status) ----
  LEGMSTAT_A: {
    id: "LEGMSTAT_A",
    featureKey: "LEGMSTAT_A",
    label: "marital status",
    type: "categorical",
    question:
      "What is your legal marital status? You can type the number or the phrase.",
    options: [
      {
        code: 1,
        label: "Married",
        aliases: ["married", "spouse", "husband", "wife"],
      },
      {
        code: 2,
        label: "Widowed",
        aliases: ["widowed", "widow", "widower"],
      },
      {
        code: 3,
        label: "Divorced",
        aliases: ["divorced"],
      },
      {
        code: 4,
        label: "Separated",
        aliases: ["separated"],
      },
      {
        code: 5,
        label: "Never married",
        aliases: ["single", "never married", "not married"],
      },
    ],
  },

  // ---- PHSTAT_A (physical health) ----
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

  // ---- BMICAT_A (weight category) ----
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

  // ---- DRKSTAT_A (alcohol use) ----
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

  // ---- SLPHOURS_A (sleep hours) ----
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

  // ---- SUPPORT_A (social/emotional support) ----
  SUPPORT_A: {
    id: "SUPPORT_A",
    featureKey: "SUPPORT_A",
    label: "emotional/social support",
    type: "categorical",
    question:
      "Overall, how often do you feel you have emotional or social support when you need it? You can type the number or the phrase.",
    info:
      "Think about friends, family, or other people you can lean on emotionally:\n\n" +
      "• Always – You almost always have someone to turn to.\n" +
      "• Usually – You have support in most situations.\n" +
      "• Sometimes – Support is there on and off.\n" +
      "• Rarely – You rarely feel supported.\n" +
      "• Never – You feel like you don't have anyone to rely on.",
    options: [
      {
        code: 1,
        label: "Always",
        aliases: ["always", "almost always"],
      },
      {
        code: 2,
        label: "Usually",
        aliases: ["usually", "most of the time"],
      },
      {
        code: 3,
        label: "Sometimes",
        aliases: ["sometimes", "on and off", "occasionally"],
      },
      {
        code: 4,
        label: "Rarely",
        aliases: ["rarely", "hardly ever"],
      },
      {
        code: 5,
        label: "Never",
        aliases: ["never", "no support"],
      },
    ],
  },

  // ---- SLPFLL_A (how refreshed after sleep) ----
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

  // ---- LONELY_A (loneliness) ----
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

  // ---- LSATIS4_A (life satisfaction) ----
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


// --------------------------------------------
// PART 2 — Continue featureSchemas
// --------------------------------------------

// ---- LEGMSTAT_A ----
featureSchemas.LEGMSTAT_A = {
  id: "LEGMSTAT_A",
  featureKey: "LEGMSTAT_A",
  label: "marital status",
  type: "categorical",
  question: "What is your current marital status?",
  options: [
    { code: 1, label: "Married", aliases: ["married"] },
    { code: 2, label: "Widowed", aliases: ["widowed"] },
    { code: 3, label: "Divorced", aliases: ["divorced"] },
    { code: 4, label: "Separated", aliases: ["separated"] },
    { code: 5, label: "Never married", aliases: ["single", "never married"] },
  ],
};

// ---- PHSTAT_A ----
featureSchemas.PHSTAT_A = {
  id: "PHSTAT_A",
  featureKey: "PHSTAT_A",
  label: "physical health",
  type: "categorical",
  question:
    "Overall, how would you rate your physical health? You can type the number or phrase.",
  info:
    "Physical health reflects your daily energy, pain levels, mobility, and how easily you perform everyday activities.\n\n" +
    "• Excellent – very energetic, few limitations\n" +
    "• Very good – mostly healthy with minor issues\n" +
    "• Good – generally okay but some issues\n" +
    "• Fair – frequent discomfort or limits\n" +
    "• Poor – major impact on daily life",
  options: [
    { code: 1, label: "Excellent", aliases: ["excellent"] },
    { code: 2, label: "Very good", aliases: ["very good"] },
    { code: 3, label: "Good", aliases: ["good"] },
    { code: 4, label: "Fair", aliases: ["fair"] },
    { code: 5, label: "Poor", aliases: ["poor"] },
  ],
};

// ---- BMICAT_A ----
featureSchemas.BMICAT_A = {
  id: "BMICAT_A",
  featureKey: "BMICAT_A",
  label: "weight category",
  type: "categorical",
  question:
    "Which best describes your body weight category? Choose the closest match.",
  info:
    "Based on BMI ranges:\n\n" +
    "• Underweight – below typical range\n" +
    "• Healthy weight – typical range\n" +
    "• Overweight – above typical range\n" +
    "• Obese – well above typical range",
  options: [
    { code: 1, label: "Underweight", aliases: ["underweight", "very thin"] },
    { code: 2, label: "Healthy weight", aliases: ["healthy", "normal"] },
    { code: 3, label: "Overweight", aliases: ["overweight"] },
    { code: 4, label: "Obese", aliases: ["obese"] },
  ],
};

// ---- DRKSTAT_A ----
featureSchemas.DRKSTAT_A = {
  id: "DRKSTAT_A",
  featureKey: "DRKSTAT_A",
  label: "alcohol use",
  type: "categorical",
  question: "Which best describes your alcohol use?",
  options: [
    {
      code: 1,
      label: "Never drink",
      aliases: ["never", "don't drink", "no alcohol"],
    },
    {
      code: 2,
      label: "Used to drink, not now",
      aliases: ["used to drink", "former drinker"],
    },
    {
      code: 3,
      label: "Light/occasional drinking",
      aliases: ["light drinker", "occasionally"],
    },
    {
      code: 4,
      label: "Heavy drinking",
      aliases: ["heavy", "a lot", "binge"],
    },
  ],
};

// ---- SLPHOURS_A ----
featureSchemas.SLPHOURS_A = {
  id: "SLPHOURS_A",
  featureKey: "SLPHOURS_A",
  label: "sleep hours",
  type: "numeric",
  question:
    "On average, how many hours do you sleep per night? (3 to 14 hours)",
  min: 3,
  max: 14,
  unitHint: "hours per night",
};

// ---- SUPPORT_A ----
featureSchemas.SUPPORT_A = {
  id: "SUPPORT_A",
  featureKey: "SUPPORT_A",
  label: "emotional support",
  type: "categorical",
  question:
    "How often do you get the emotional support you need? Type the number or phrase.",
  info:
    "Emotional support includes feeling understood, cared for, and having someone to talk to.\n\n" +
    "Think about the past month.",
  options: [
    { code: 1, label: "Always", aliases: ["always"] },
    { code: 2, label: "Usually", aliases: ["usually", "most of the time"] },
    { code: 3, label: "Sometimes", aliases: ["sometimes", "occasionally"] },
    { code: 4, label: "Rarely", aliases: ["rarely"] },
    { code: 5, label: "Never", aliases: ["never"] },
  ],
};

// ---- SLPFLL_A ----
featureSchemas.SLPFLL_A = {
  id: "SLPFLL_A",
  featureKey: "SLPFLL_A",
  label: "how refreshed you feel after sleep",
  type: "categorical",
  question:
    "After sleeping, how refreshed do you usually feel?",
  info:
    "Think about most days:\n\n" +
    "• Not at all – still exhausted\n" +
    "• A little – slightly rested\n" +
    "• Fairly – okay with some energy\n" +
    "• Very – energized and clear",
  options: [
    { code: 1, label: "Not at all refreshed", aliases: ["not at all"] },
    { code: 2, label: "A little refreshed", aliases: ["a little"] },
    { code: 3, label: "Fairly refreshed", aliases: ["fairly"] },
    { code: 4, label: "Very refreshed", aliases: ["very refreshed"] },
  ],
};

// ---- LONELY_A ----
featureSchemas.LONELY_A = {
  id: "LONELY_A",
  featureKey: "LONELY_A",
  label: "loneliness",
  type: "categorical",
  question: "How often do you feel lonely?",
  options: [
    { code: 1, label: "Never", aliases: ["never"] },
    { code: 2, label: "Rarely", aliases: ["rarely"] },
    { code: 3, label: "Sometimes", aliases: ["sometimes"] },
    { code: 4, label: "Often", aliases: ["often", "frequently"] },
    { code: 5, label: "Always", aliases: ["always"] },
  ],
};

// ---- LSATIS4_A ----
featureSchemas.LSATIS4_A = {
  id: "LSATIS4_A",
  featureKey: "LSATIS4_A",
  label: "life satisfaction",
  type: "categorical",
  question:
    "Overall, how satisfied are you with your life right now?",
  options: [
    { code: 1, label: "Very satisfied", aliases: ["very satisfied"] },
    { code: 2, label: "Satisfied", aliases: ["satisfied"] },
    { code: 3, label: "Dissatisfied", aliases: ["dissatisfied"] },
    { code: 4, label: "Very dissatisfied", aliases: ["very dissatisfied"] },
  ],
};

// --------------------------------------------
// Helper functions
// --------------------------------------------
function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+/);
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

  // User types a number
  const n = extractFirstNumber(userText);
  if (n !== null) {
    const opt = schema.options.find((o) => o.code === n);
    if (opt) return { value: opt.code, label: opt.label, interpreted: false };
  }

  // Exact label match
  for (const opt of schema.options) {
    if (lower === normalize(opt.label)) {
      return { value: opt.code, label: opt.label, interpreted: false };
    }
  }

  // Alias match
  for (const opt of schema.options) {
    for (const alias of opt.aliases) {
      if (lower.includes(normalize(alias))) {
        return { value: opt.code, label: opt.label, interpreted: true };
      }
    }
  }

  return null;
}

function formatPercentage(p?: number): string {
  if (!p && p !== 0) return "N/A";
  const pct = Math.round(p * 1000) / 10;
  return `${pct.toFixed(1)}%`;
}

function buildSuggestionText(result: { depression_probability?: number; anxiety_probability?: number }): string {
  const d = result.depression_probability ?? 0;
  const a = result.anxiety_probability ?? 0;
  const max = Math.max(d, a);

  if (max < 0.25)
    return "These scores suggest a low likelihood of strong depression or anxiety. Keep maintaining healthy habits.";

  if (max < 0.5)
    return "These scores suggest a mild likelihood. Pay attention to your emotional patterns and maintain healthy routines.";

  if (max < 0.75)
    return "These scores suggest a moderate likelihood. Consider talking with a counselor or therapist if things feel overwhelming.";

  return "These scores suggest a higher likelihood. If you feel distressed or overwhelmed, please reach out to a mental health professional or trusted person soon.";
}

// --------------------------------------------
// Component: ChatbotSection (BEGIN)
// --------------------------------------------
const ChatbotSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [featureIndex, setFeatureIndex] = useState<number>(-1);
  const [collected, setCollected] = useState<Record<string, number>>({});
  const [lastPrediction, setLastPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hoveredInfoFeatureId, setHoveredInfoFeatureId] =
    useState<FeatureId | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const introMessages: ChatMessage[] = [
    {
      role: "assistant",
      text: "Hi, I'm MIND Companion — a mental health chatbot focusing on depression and anxiety."
    },
    {
      role: "assistant",
      text: "I can guide you through a questionnaire and show your depression/anxiety prediction."
    },
    {
      role: "assistant",
      text: "Would you like to start the prediction now?"
    }
  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(introMessages);
      setPhase("intro");
      setFeatureIndex(-1);
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isPredicting]);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  // --- extra state for editing + restart flow ---
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [waitingForRestartConfirm, setWaitingForRestartConfirm] =
    useState(false);

  // Reset to initial intro state
  const resetChat = () => {
    setMessages(introMessages);
    setPhase("intro");
    setFeatureIndex(-1);
    setCollected({});
    setLastPrediction(null);
    setLoading(false);
    setIsPredicting(false);
    setHoveredInfoFeatureId(null);
    setIsEditingAnswer(false);
    setWaitingForRestartConfirm(false);
  };

  // Call OpenAI mental–health bot
  const askMentalHealthAgent = async (userText: string, extra = "") => {
    setLoading(true);
    const reply = await callOpenAI([
      mentalHealthSystemPrompt,
      {
        role: "user",
        content: `User message: "${userText}"\n\n${extra}\nIf the message is unrelated to mental health, politely decline.`,
      },
    ]);
    addMessage({ role: "assistant", text: reply });
    setLoading(false);
  };

  const currentFeatureId = (): FeatureId | null => {
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
      lines.push(`You can reply with a single number (${schema.unitHint}).`);
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
    setLastPrediction(null);
    setIsEditingAnswer(false);
    setWaitingForRestartConfirm(false);

    addMessage({
      role: "assistant",
      text:
        "Great — we’ll go through a short set of questions. Please answer as honestly as you can.",
    });
    askQuestionForFeature(featureOrder[0]);
  };

  const handleChangeLastAnswerCommand = () => {
    if (featureIndex <= 0 && !Object.keys(collected).length) {
      addMessage({
        role: "assistant",
        text:
          "We haven't recorded any answers yet to change. Let's start from the first question.",
      });
      return;
    }

    // Last answered feature is either currentIndex - 1 (if collecting)
    // or the last in featureOrder (if we’re in review).
    const lastIdx =
      phase === "collecting"
        ? Math.max(featureIndex - 1, 0)
        : featureOrder.length - 1;

    const fid = featureOrder[lastIdx];
    setFeatureIndex(lastIdx);
    setPhase("collecting");
    setIsEditingAnswer(true);

    addMessage({
      role: "assistant",
      text: `No problem, let's update your ${featureSchemas[fid].label}.`,
    });
    askQuestionForFeature(fid);
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
        '- "change my life satisfaction", "edit my region", etc.\n\n' +
        'When everything looks right, you can type "confirm", "ok", or "looks good" and I’ll run the prediction.'
    );

    addMessage({ role: "assistant", text: lines.join("\n") });
  };

  const sendToFastAPI = async () => {
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

      const result = JSON.parse(text);
      setLastPrediction(result);

      const anxietyPct = formatPercentage(result.anxiety_probability);
      const depressionPct = formatPercentage(result.depression_probability);
      const suggestion = buildSuggestionText(result);

      const summaryText =
        `Your prediction scores are:\n\n` +
        `• Anxiety: ${anxietyPct}\n` +
        `• Depression: ${depressionPct}\n\n` +
        `Suggestion: ${suggestion}`;

      addMessage({ role: "assistant", text: summaryText });

      // Ask if they want to restart the questionnaire
      addMessage({
        role: "assistant",
        text:
          "If you’d like, I can restart the questionnaire so you can try different answers.\n" +
          'Type "restart" or "start again" to begin a new run, or you can just keep chatting about how you feel.',
      });

      setPhase("after_prediction");
      setWaitingForRestartConfirm(true);
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

  const handleEditByName = (textLower: string): boolean => {
    const mapping: { keywords: string[]; feature: FeatureId }[] = [
      { keywords: ["age"], feature: "AGEP_A" },
      { keywords: ["sex", "gender"], feature: "SEX_A" },
      { keywords: ["education", "school"], feature: "EDUCP_A" },
      { keywords: ["region"], feature: "REGION" },
      { keywords: ["urban", "rural", "metro"], feature: "URBRRL23" },
      { keywords: ["adults"], feature: "PCNTADLT_A" },
      { keywords: ["children", "kids"], feature: "PCNTKIDS_A" },
      { keywords: ["marital", "married"], feature: "LEGMSTAT_A" },
      { keywords: ["physical health", "health"], feature: "PHSTAT_A" },
      { keywords: ["weight", "bmi"], feature: "BMICAT_A" },
      { keywords: ["alcohol", "drink"], feature: "DRKSTAT_A" },
      { keywords: ["sleep hours"], feature: "SLPHOURS_A" },
      { keywords: ["refreshed", "sleep quality"], feature: "SLPFLL_A" },
      { keywords: ["support"], feature: "SUPPORT_A" },
      { keywords: ["lonely", "loneliness"], feature: "LONELY_A" },
      { keywords: ["life satisfaction", "satisfied"], feature: "LSATIS4_A" },
    ];

    for (const entry of mapping) {
      if (entry.keywords.some((k) => textLower.includes(k))) {
        const idx = featureOrder.indexOf(entry.feature);
        if (idx === -1) break;

        setPhase("collecting");
        setFeatureIndex(idx);
        setIsEditingAnswer(true);

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

    if (schema.type === "categorical" && interpretedCat && interpretedCat.interpreted) {
      addMessage({
        role: "assistant",
        text: `I'll interpret your answer as "${interpretedCat.label}". If that's not right, please type "change my last answer".`,
      });
    }

    // If we are in edit mode, go straight back to review summary
    if (isEditingAnswer) {
      setIsEditingAnswer(false);
      setPhase("review");
      showReviewSummary();
      return;
    }

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

    // Otherwise treat as a chat question
    void askMentalHealthAgent(text);
  };

  const handleUserMessageAfterPrediction = (text: string) => {
    const lower = normalize(text);

    if (
      waitingForRestartConfirm &&
      (lower.includes("restart") || lower.includes("start again"))
    ) {
      resetChat();
      // Immediately start new questionnaire
      beginQuestionnaire();
      return;
    }

    if (
      waitingForRestartConfirm &&
      (lower === "no" || lower.includes("not now") || lower.includes("later"))
    ) {
      setWaitingForRestartConfirm(false);
      addMessage({
        role: "assistant",
        text:
          "Okay, we’ll keep your current results. You can still ask me questions about how you're feeling.",
      });
      return;
    }

    void askMentalHealthAgent(
      text,
      lastPrediction
        ? `Their last prediction was: ${JSON.stringify(lastPrediction)}`
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

  // --------------------------------------------
  // JSX UI
  // --------------------------------------------
  return (
    <section
      id="chatbot"
      className="mx-auto max-w-6xl px-4 py-10 md:py-14 border-t border-slate-800 animate-fadeInUp"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1 bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent heading-glow">
            Mental Health Chatbot
          </h2>
          <p className="text-slate-700 text-sm md:text-base">
            This chatbot walks you through a short questionnaire and then
            explains a depression/anxiety prediction from your model. It is{" "}
            <span className="font-semibold">
              not a substitute for professional care or crisis support
            </span>
            . Avoid sharing sensitive personal information.
          </p>
        </div>
        <button
          onClick={resetChat}
          className="rounded-full border border-sky-400/60 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-slate-800 transition shadow-md shadow-slate-900/60"
        >
          ↺ Restart questionnaire
        </button>
      </div>

      <div className="bg-slate-950/80 rounded-2xl shadow-xl border border-slate-800 flex flex-col h-[500px] backdrop-blur-xl">
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
              !!schema && !!schema.info && hoveredInfoFeatureId === msg.featureId;

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
                                  <div className="absolute left-4 top-5 z-30 w-96 max-w-xl rounded-md bg-slate-900/95 p-3 text-[11px] text-slate-100 shadow-lg border border-slate-700 whitespace-pre-line max-h-48 overflow-y-auto">
                                    {schema.info}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

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
        If you are in immediate distress or thinking about self-harm, please
        contact local emergency services or a crisis hotline in your area.
      </p>
    </section>
  );
};

export default ChatbotSection;


