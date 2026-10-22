import React from 'react';
import { motion } from 'motion/react';
import { KochiMetroLogo } from './KochiMetroLogo';
import { Shield, Sparkles } from 'lucide-react';

interface LandingNavbarProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 px-6 py-6 w-full"
    >
      <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto border border-cyan-500/20">
        {/* Left side */}
        <div className="flex items-center gap-8">
          <div onClick={onLoginClick} className="flex items-center gap-3 cursor-pointer group">
            <div className="p-1 bg-slate-950/80 rounded-sm border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <KochiMetroLogo height={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-tight leading-none group-hover:text-cyan-400 transition-colors">KMRL ODSS</span>
              <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">AI Train Induction</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
            <button onClick={onLoginClick} className="hover:text-cyan-300 transition-colors duration-300 text-xs font-mono">
              Features
            </button>
            <button onClick={onLoginClick} className="hover:text-cyan-300 transition-colors duration-300 text-xs font-mono">
              Live Telemetry
            </button>
            <button onClick={onLoginClick} className="hover:text-cyan-300 transition-colors duration-300 text-xs font-mono">
              Readiness AI
            </button>
            <button onClick={onLoginClick} className="hover:text-cyan-300 transition-colors duration-300 text-xs font-mono">
              Digital Twin
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Aqua Line Active (25 Rakes)</span>
          </div>
          <button
            onClick={onLoginClick}
            className="liquid-glass rounded-full px-5 py-2 text-xs font-semibold font-mono text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch ODSS Console</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

