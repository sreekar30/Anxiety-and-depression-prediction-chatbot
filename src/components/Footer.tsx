import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <p>
        This project is only for learning and research. It is not a substitute for professional mental health care.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
