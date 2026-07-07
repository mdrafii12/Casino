/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, Database, Binary, Key, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface GameProcessingOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  gameName: string;
  betAmount: number;
}

interface LogEntry {
  time: string;
  message: string;
  status: 'pending' | 'success';
}

export default function GameProcessingOverlay({ isOpen, onComplete, gameName, betAmount }: GameProcessingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30.0);
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastSecondRef = useRef<number>(30);

  const steps = [
    { text: '📡 Establishing secure connection to LuckyVerse enclave...', duration: 3.5 },
    { text: '🔑 Retrieving provably fair Server Seed Hash (SHA-256)...', duration: 4.0 },
    { text: '🛡️ Verifying Client Seed handshake & session token...', duration: 3.5 },
    { text: '🔋 Reserving virtual play chips in isolated vault...', duration: 3.0 },
    { text: '⚙️ Performing quantum entropy seed calculations...', duration: 4.5 },
    { text: '⛓️ Mixing Server Salt with Client Salt vector...', duration: 3.5 },
    { text: '🎰 Simulating round outcome on cryptographic wheel...', duration: 4.0 },
    { text: '✨ Generating provably fair verification certificate...', duration: 4.0 },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setTimeLeft(30.0);
      setActiveStep(0);
      setLogs([]);
      lastSecondRef.current = 30;
      return;
    }

    // Play initial sound
    sounds.playTone(300, 'sine', 0.15, 0.05);
    setTimeout(() => sounds.playTone(450, 'sine', 0.2, 0.05), 100);

    // Initialize first log
    setLogs([
      {
        time: '0.00s',
        message: 'Initializing provably fair round verification protocols...',
        status: 'success',
      },
    ]);

    const totalDurationMs = 30000;
    const updateIntervalMs = 50; // smooth update every 50ms
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / totalDurationMs) * 100, 100);
      const calculatedTimeLeft = Math.max(30 - elapsed / 1000, 0);

      setProgress(calculatedProgress);
      setTimeLeft(calculatedTimeLeft);

      // Sound feedback on each full second ticking
      const currentSecondFloor = Math.ceil(calculatedTimeLeft);
      if (currentSecondFloor < lastSecondRef.current) {
        lastSecondRef.current = currentSecondFloor;
        // High pitched click for countdown ticking
        sounds.playTone(800, 'sine', 0.02, 0.03);
      }

      // Check current active step
      let accumulatedTime = 0;
      let currentStepIndex = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulatedTime += steps[i].duration * 1000;
        if (elapsed >= accumulatedTime) {
          currentStepIndex = i + 1;
        } else {
          break;
        }
      }

      if (currentStepIndex !== activeStep && currentStepIndex < steps.length) {
        setActiveStep(currentStepIndex);
        sounds.playTone(600, 'sine', 0.03, 0.04); // Step transition sound

        // Add to log list
        const timeStr = `${(elapsed / 1000).toFixed(2)}s`;
        setLogs(prev => {
          // Set previous last log to success
          const updated = prev.map((l, idx) =>
            idx === prev.length - 1 ? { ...l, status: 'success' as const } : l
          );
          return [
            ...updated,
            {
              time: timeStr,
              message: steps[currentStepIndex].text,
              status: 'pending',
            },
          ];
        });
      }

      if (elapsed >= totalDurationMs) {
        clearInterval(interval);
        // Play final success sound
        sounds.playTone(523.25, 'sine', 0.15, 0.05); // C5
        setTimeout(() => sounds.playTone(659.25, 'sine', 0.25, 0.08), 80); // E5
        onComplete();
      }
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Render circular path progress
  const strokeDashoffset = 283 - (283 * progress) / 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-6 text-white rounded-2xl border border-amber-500/20"
      >
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-2xl animate-pulse" />

        <div className="w-full max-w-lg space-y-6 text-center z-10 flex flex-col items-center">
          
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono text-amber-400 tracking-widest uppercase font-extrabold">
                Provably Fair Security Enclave
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-extrabold tracking-wider text-gold-gradient uppercase">
              Verifying Round Results
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Game: <span className="text-white uppercase font-bold">{gameName}</span> • Bet: <span className="text-amber-400 font-bold">{betAmount} Coins</span>
            </p>
          </div>

          {/* Circle Timer */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-zinc-800/60 fill-none"
                strokeWidth="6"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-amber-400 fill-none filter drop-shadow-[0_0_6px_#f59e0b]"
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transition={{ ease: 'linear' }}
              />
            </svg>
            
            {/* Countdown Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-white">
                {timeLeft.toFixed(2)}s
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-amber-500 font-bold tracking-widest uppercase">
                Remaining
              </span>
            </div>
          </div>

          {/* Progressive Step Message */}
          <div className="w-full min-h-[44px] px-4 flex items-center justify-center bg-zinc-950/40 rounded-xl border border-white/5 py-2">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <p className="text-xs sm:text-sm font-mono text-zinc-300 font-medium">
                {steps[activeStep]?.text || 'Finalizing round calculations...'}
              </p>
            </div>
          </div>

          {/* Cryptographic Progress Logs console */}
          <div className="w-full bg-black/80 rounded-xl border border-white/10 p-3 text-left font-mono space-y-1.5 h-[130px] sm:h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 border-b border-white/5 pb-1 mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              <span>CRYPTOGRAPHIC SERVER VERIFICATION STREAM</span>
            </div>
            
            <div className="space-y-1.5 text-[9px] sm:text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-500 font-bold shrink-0">[{log.time}]</span>
                  <span className="text-zinc-300 flex-1">{log.message}</span>
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-amber-500 border-t-transparent animate-spin shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom security assurance */}
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Provably Fair • Hashed with SHA-256 for maximum integrity and transparency</span>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
