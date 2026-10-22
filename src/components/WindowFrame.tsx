import React from 'react';
import { Minus, Square, Maximize2, Minimize2, X, Sparkles } from 'lucide-react';

interface WindowFrameProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'rose';
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'cyan',
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  children,
}) => {
  const badgeClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  }[badgeColor];

  return (
    <div
      className={`transition-all duration-300 flex flex-col overflow-hidden backdrop-blur-2xl border shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl ${
        isMaximized
          ? 'w-full h-full bg-slate-950/90 border-cyan-500/30'
          : 'w-full max-h-[86vh] bg-slate-950/85 border-cyan-500/40 my-auto shadow-[0_0_50px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Window Titlebar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border-b border-cyan-500/30 flex items-center justify-between flex-shrink-0 select-none">
        
        {/* Left Title & Status */}
        <div className="flex items-center space-x-3">
          {/* Cyber Window Dots */}
          <div className="flex items-center space-x-1.5 mr-1">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-400 transition-colors cursor-pointer"
              title="Close Window"
            />
            <button
              onClick={onMinimize}
              className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-400 transition-colors cursor-pointer"
              title="Minimize Window"
            />
            <button
              onClick={onToggleMaximize}
              className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-400 transition-colors cursor-pointer"
              title={isMaximized ? "Restore Window Size" : "Maximize Window"}
            />
          </div>

          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Icon className="w-4 h-4 text-cyan-300" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                <span>{title}</span>
              </h2>
              {badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase ${badgeClasses}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-cyan-300/80 font-mono tracking-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Minimize Window to Dock"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMaximize}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
            title="Close Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Inner Content View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans scrollbar-thin scrollbar-thumb-cyan-500/20">
        {children}
      </div>
    </div>
  );
};
