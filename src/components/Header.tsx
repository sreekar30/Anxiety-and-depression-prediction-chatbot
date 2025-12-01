import React from "react";

interface HeaderProps {
  activeSection: string;
}

const navItems = [
  { id: "facts", label: "Facts" },
  { id: "about", label: "About" },
  { id: "chatbot", label: "Chatbot" },
  { id: "dashboard", label: "Dashboard" },
];

const Header: React.FC<HeaderProps> = ({ activeSection }) => {
  return (
    <header className="sticky top-0 z-20 pt-5 pb-3 bg-transparent backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3">
        {/* Big centered title */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-center bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent tracking-tight">
          Anxiety &amp; Depression Prediction
        </h1>

        {/* Centered menu bar in its own container */}
        <nav className="flex items-center justify-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/85 px-3 py-1 shadow-lg shadow-slate-950/70">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-xs md:text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-sky-400 text-slate-900 shadow-sm shadow-sky-500/60"
                    : "text-slate-200 hover:text-sky-300 hover:bg-slate-800/80"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
