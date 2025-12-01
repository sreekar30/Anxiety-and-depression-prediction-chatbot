import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import AboutSection from "./components/AboutSection";
import FactsCarousel from "./components/FactsCarousel";
import DashboardSection from "./components/DashboardSection";
import ChatbotSection from "./components/ChatbotSection";
import Footer from "./components/Footer";

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("about");

  useEffect(() => {
    const sectionIds = ["about", "facts", "dashboard", "chatbot"];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      let closestId = sectionIds[0];
      let closestDistance = Infinity;

      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const distance = Math.abs(top - (scrollY + 80)); // 80 ≈ header height
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = id;
        }
      });

      setActiveSection(closestId);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header activeSection={activeSection} />
      <main className="flex-1">

        <FactsCarousel />
        <AboutSection />
        <ChatbotSection />
        <DashboardSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;
