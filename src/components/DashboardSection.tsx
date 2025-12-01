// src/components/DashboardSection.tsx
import React from "react";
import {
  TABLEAU_DASHBOARD_URL_1,
  TABLEAU_DASHBOARD_URL_2,
  TABLEAU_DASHBOARD_URL_3,
} from "../config";

const DashboardSection: React.FC = () => {
  const tableauUrl1 = TABLEAU_DASHBOARD_URL_1
    ? `${TABLEAU_DASHBOARD_URL_1}?:showVizHome=no&:embed=true&:toolbar=top`
    : "";

  const tableauUrl2 = TABLEAU_DASHBOARD_URL_2
    ? `${TABLEAU_DASHBOARD_URL_2}?:showVizHome=no&:embed=true&:toolbar=top`
    : "";

  const tableauUrl3 = TABLEAU_DASHBOARD_URL_3
    ? `${TABLEAU_DASHBOARD_URL_3}?:showVizHome=no&:embed=true&:toolbar=top`
    : "";

  const anyDashboardConfigured =
    tableauUrl1 || tableauUrl2 || tableauUrl3;

  const scrollToChat = () => {
    const el = document.getElementById("chatbot");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="dashboard"
      className="mx-auto max-w-6xl px-4 py-10 md:py-14 animate-fadeInUp"
    >
      {/* Top heading + CTA */}
      <div className="text-center mb-6">

        <h2 className="text-2xl font-semibold text-slate-900 mt-4 mb-2">
          Interactive Prediction Dashboard
        </h2>
        <p className="text-slate-700 max-w-2xl mx-auto text-sm md:text-base">
          These visualizations show model-based patterns related to anxiety and
          depression. Use the filters inside each chart to explore how the
          curves change across different groups or conditions.
        </p>
      </div>

      {/* Main content */}
      {!anyDashboardConfigured ? (
        <p className="text-red-600 text-sm">
          Tableau dashboard URLs are not fully configured. Please set{" "}
          <code>VITE_TABLEAU_DASHBOARD_URL_1</code>,{" "}
          <code>VITE_TABLEAU_DASHBOARD_URL_2</code>, and{" "}
          <code>VITE_TABLEAU_DASHBOARD_URL_3</code> in your <code>.env</code>{" "}
          file.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Card 1 – Anxiety */}
          {tableauUrl1 ? (
            <div className="bg-slate-950/80 border border-sky-700/60 rounded-2xl shadow-xl shadow-sky-900/80 overflow-hidden flex flex-col backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-col items-center text-center gap-1">
                <h3 className="text-sm font-semibold text-slate-50">
                  Anxiety Visualization
                </h3>
                <p className="text-xs text-slate-200">
                  Explore predicted anxiety levels across different filters.
                </p>
              </div>
              <div className="w-full h-[520px] bg-slate-900 overflow-hidden">
                <iframe
                  title="Anxiety Prediction Dashboard"
                  src={tableauUrl1}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            </div>
          ) : null}

          {/* Card 2 – Depression */}
          {tableauUrl2 ? (
            <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-xl shadow-violet-900/80 overflow-hidden flex flex-col backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-col items-center text-center gap-1">
                <h3 className="text-sm font-semibold text-slate-50">
                  Depression Visualization
                </h3>
                <p className="text-xs text-slate-200">
                  View how depression predictions vary with the same filters.
                </p>
              </div>
              <div className="w-full h-[520px] bg-slate-900 overflow-hidden">
                <iframe
                  title="Depression Prediction Dashboard"
                  src={tableauUrl2}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            </div>
          ) : null}

          {/* Card 3 – Third visualization (e.g. combined / factors) */}
          {tableauUrl3 ? (
            <div className="bg-slate-950/80 border border-emerald-700/60 rounded-2xl shadow-xl shadow-emerald-900/80 overflow-hidden flex flex-col backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-col items-center text-center gap-1">
                <h3 className="text-sm font-semibold text-slate-50">
                  Risk & Factors Visualization
                </h3>
                <p className="text-xs text-slate-200">
                  Examine how lifestyle and other factors relate to predicted
                  anxiety and depression.
                </p>
              </div>
              <div className="w-full h-[520px] bg-slate-900 overflow-hidden">
                <iframe
                  title="Risk Factors Prediction Dashboard"
                  src={tableauUrl3}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3 text-center">
        These visualizations do not provide a diagnosis and should not be used
        for emergency decision-making. If you are concerned about your mental
        health, please speak with a qualified professional.
      </p>
    </section>
  );
};

export default DashboardSection;
