import React, { useEffect, useState } from "react";

const FACTS: string[] = [
  "Age group of 18-29 are more prone to Anxiety/Depression than Age Groups.",
  "Physical Health Status is crucial, as depleting health can lead to Depression/Anxiety.",
  "People who received emotional or social support rarely showed most depression/anxiety cases.",
  "People who slept very low or very high showed signs of Depression/Anxiety more.",
  "People dissatisfied towards their life showed more sign of Depression/Anxiety.",
];

const FactsCarousel: React.FC = () => {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((prev) => (prev + 1) % FACTS.length),
      2000
    );
    return () => window.clearInterval(id);
  }, []);

  const prev = () =>
    setIndex((prev) => (prev - 1 + FACTS.length) % FACTS.length);
  const next = () => setIndex((prev) => (prev + 1) % FACTS.length);

  return (
    <section
      id="facts"
      className="py-8 md:py-10 animate-fadeInUp"
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <span>Facts about Anxiety &amp; Depression</span>
        </h2>

        <div className="relative flex items-center justify-between gap-4">
          {/* prev button */}
          <button
            onClick={prev}
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition"
            aria-label="Previous fact"
          >
            ‹
          </button>

          {/* dark fact card */}
          <div className="flex-1 bg-slate-900 text-slate-50 border border-slate-800 rounded-2xl px-5 py-4 shadow-xl shadow-slate-300/60">
            <p className="text-sm md:text-base min-h-[4rem] transition-all">
              {FACTS[index]}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {FACTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full ${
                    i === index ? "bg-sky-400" : "bg-slate-500"
                  }`}
                  aria-label={`Show fact ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* next button */}
          <button
            onClick={next}
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition"
            aria-label="Next fact"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};

export default FactsCarousel;
