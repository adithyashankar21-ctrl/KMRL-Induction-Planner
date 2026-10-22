import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Play } from 'lucide-react';

interface LandingHeroProps {
  onEnterConsole?: () => void;
  onPlayDemo?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterConsole,
  onPlayDemo,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');

  const targetPlaceholderText = isSubmitted
    ? 'You Will Receive Operational Briefings By Email'
    : 'Enter Officer Email For Deployment Access';

  // Typewriter effect handler
  useEffect(() => {
    if (!isFormOpen) {
      setTypewriterText('');
      return;
    }

    setTypewriterText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < targetPlaceholderText.length) {
        setTypewriterText((prev) => targetPlaceholderText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isFormOpen, isSubmitted, targetPlaceholderText]);

  // Reset timer after submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setIsFormOpen(false);
        setEmail('');
        setTypewriterText('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !isSubmitted) return;
    setIsSubmitted(true);
  };

  return (
    <section className="relative flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center w-full gap-10">
        <div>
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] md:text-[11px] font-mono font-medium tracking-[0.2em] uppercase mb-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>KOCHI METRO RAIL LIMITED • AI INDUCTION ODSS</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-4xl md:text-[64px] font-medium tracking-[-0.01em] leading-[1.1] mb-4 bg-gradient-to-b from-white via-white/95 to-slate-300 bg-clip-text text-transparent max-w-4xl"
          >
            Autonomous train induction & readiness intelligence for metro transit
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Automating operational planning, multi-criteria fitness scoring, Muttom Depot stabling sequencing, and mileage equalization for 25 metro trainsets.
          </motion.p>
        </div>

        {/* CTA Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="min-h-[50px] mt-2 flex flex-col items-center justify-center"
        >
          <AnimatePresence mode="wait">
            {!isFormOpen ? (
              <motion.button
                key="access-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsFormOpen(true)}
                className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 text-white/90 backdrop-blur-sm cursor-pointer shadow-lg"
              >
                Get early access
              </motion.button>
            ) : (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 text-[14px] font-medium border border-white/20 rounded-full bg-white/[0.02] backdrop-blur-sm w-full max-w-[320px] focus-within:border-white/40 transition-colors duration-300"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={typewriterText}
                  autoFocus
                  disabled={isSubmitted}
                  className="w-full bg-transparent text-white placeholder-white/45 outline-none text-xs md:text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitted}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"
                >
                  {isSubmitted ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Play Video Demo & KMRL Console Launcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4"
        >
          <button
            onClick={onPlayDemo}
            className="text-white/80 hover:text-white/40 transition-colors duration-300 text-[13px] font-medium tracking-wide flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Video Demo</span>
          </button>

          {onEnterConsole && (
            <button
              onClick={onEnterConsole}
              className="px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-[12px] font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Launch KMRL ODSS Console</span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
