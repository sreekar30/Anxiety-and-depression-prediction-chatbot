// src/components/AboutSection.tsx
import React from "react";

const AboutSection: React.FC = () => {
  const scrollToChat = () => {
    const el = document.getElementById("chatbot");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="about"
      className="mx-auto max-w-6xl px-4 py-10 md:py-14 animate-fadeInUp"
    >
      {/* CTA to start chat-based prediction */}
      <div className="w-full flex justify-center mb-8">
        <button
          onClick={scrollToChat}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-900 text-sm font-semibold px-5 py-2.5 shadow-lg shadow-sky-800/70 hover:shadow-indigo-800/80 hover:-translate-y-0.5 transition-transform"
        >
          Start chat-based prediction
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Anxiety card */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-xl shadow-slate-950/70 p-6 md:p-7 backdrop-blur-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/60">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-50 text-center">
              Understanding Anxiety
            </h2>
            <div className="h-0.5 w-16 bg-sky-400/80 rounded-full" />
          </div>
          <p className="text-slate-200/90 mb-3 text-sm md:text-base">
            Anxiety is a common mental health experience that involves excessive
            worry, fear, or nervousness. It can affect how we feel, think, and
            behave, and may show up as restlessness, difficulty concentrating,
            irritability, or physical symptoms such as a racing heart or trouble
            sleeping.
          </p>
          <p className="text-slate-200/90 text-sm md:text-base">
            Everyone feels anxious sometimes, but when these feelings are
            intense, long-lasting, or interfere with daily life, it may be a
            sign of an anxiety disorder.
          </p>
        </div>

        {/* Depression card */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-xl shadow-slate-950/70 p-6 md:p-7 backdrop-blur-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-900/60">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-50 text-center">
              Understanding Depression
            </h2>
            <div className="h-0.5 w-16 bg-violet-400/80 rounded-full" />
          </div>
          <p className="text-slate-200/90 mb-3 text-sm md:text-base">
            Depression is more than feeling sad. It can involve a persistent low
            mood, loss of interest in activities, changes in sleep or appetite,
            and feelings of hopelessness or worthlessness. These experiences can
            make everyday tasks feel exhausting or meaningless.
          </p>
          <p className="text-slate-200/90 text-sm md:text-base">
            With the right support and treatment, people can recover and manage
            symptoms effectively. The visualization and chatbot on this page are
            designed to support awareness, not to provide a diagnosis.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
