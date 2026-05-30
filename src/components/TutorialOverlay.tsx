import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X, Play, BookOpen, Layers, Sparkles, Check, HelpCircle } from 'lucide-react';
import { OPMModel, ElementType, Essence, Affiliation, LinkType } from '../types';

interface TutorialOverlayProps {
  currentStep: number;
  totalSteps: number;
  isOpen: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: (keepModel: boolean) => void;
  targetId?: string;
  stepTitle: string;
  stepDescription: string;
  stepLongDescription: string;
}

export default function TutorialOverlay({
  currentStep,
  totalSteps,
  isOpen,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  targetId,
  stepTitle,
  stepDescription,
  stepLongDescription,
}: TutorialOverlayProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Read dimensions of the highlighted elements in the viewport
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      }
      setCoords(null);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    // Minor polling in case of asynchronous render or sidebar transitions
    const timer = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      clearInterval(timer);
    };
  }, [targetId, currentStep, isOpen]);

  if (!isOpen) return null;

  // Step 0 is the Intro screen
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
          {/* Banner Graphic background */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 px-8 py-10 relative overflow-hidden text-white border-b border-indigo-950">
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-2xl flex items-center justify-center shadow-inner">
                <BookOpen className="text-indigo-400 w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Interactive Walkthrough</span>
                <h2 className="text-2xl font-black tracking-tight mt-0.5">Automated Espresso Maker</h2>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm">
              <p className="text-base text-slate-800 font-semibold mb-2">
                What are we modeling?
              </p>
              <p className="mb-4">
                We will build a complete system model for an <strong>Automated Espresso Maker</strong>. In OPM, we represent the physical hardware (Water Tank, Grinder), system characteristics (Water Temperature), operational processes (Water Heating, Espresso Brewing), and outcomes (Espresso Cup state transformations) in one single view.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 mb-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Expected OPM Modelling Benefits
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-medium">
                  <li><strong>Single-Pane Context:</strong> Unifies hardware, software commands, and physical states together, bypassing fragmented diagrams.</li>
                  <li><strong>Human-Readable Specs (OPL):</strong> The system auto-generates semantic English sentences so non-technical collaborators and engineering leads stay in absolute alignment.</li>
                  <li><strong>Absolute Validation:</strong> Directly highlights exact constraints (e.g. brewing only occurs once heating is finished and water is full).</li>
                </ul>
              </div>

              <div className="flex gap-4 p-4 border border-indigo-50 bg-indigo-50/20 rounded-2xl">
                <span className="text-lg">🎯</span>
                <div>
                  <h4 className="font-bold text-indigo-900 text-xs">Self-Guided Pilot Control</h4>
                  <p className="text-xs text-indigo-700/80 mt-0.5">
                    Click <strong>Next Step</strong> to let OPM-Pro build the model incrementally before your eyes, showing you exactly which tools and sidebars are active at each stage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={onSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip Tutorial
            </button>
            <button 
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-150"
            >
              Start Walkthrough <Play className="w-3.5 h-3.5 fill-white text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Highlight Box Position calculations
  const showHighlight = coords !== null;
  const isLastStep = currentStep === totalSteps - 1;

  // Choose dialog positions based on where we are highlighting
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
  };

  if (showHighlight && coords) {
    if (targetId === 'properties-sidebar' || targetId === 'opl-panel') {
      // Sidebar highlighted: place dialog to the left
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.max(100, coords.top + 30),
        right: window.innerWidth - coords.left + 24,
        width: '380px',
      };
    } else {
      // Toolbar/left-side highlighted: place dialog to the right of the toolbar
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.min(window.innerHeight - 340, Math.max(30, coords.top - 10)),
        left: coords.left + coords.width + 24,
        width: '380px',
      };
    }
  } else {
    // Centered or fallback when no element highlighted
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '440px',
    };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans">
      {/* Dimmed Background Overlay with cutout using double shadow-outline layer or backdrop blend */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-auto" onClick={onSkip} />

      {/* SVG mask implementation for perfect element cutouts */}
      {showHighlight && coords && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40">
          <defs>
            <mask id="tutorial-cutout-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect 
                x={coords.left - 6} 
                y={coords.top - 6} 
                width={coords.width + 12} 
                height={coords.height + 12} 
                rx={12} 
                fill="black" 
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(8, 15, 30, 0.45)" mask="url(#tutorial-cutout-mask)" />
        </svg>
      )}

      {/* Pulsing Highlight Outline bounding box */}
      {showHighlight && coords && (
        <div 
          className="absolute z-50 ring-4 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-2xl animate-pulse pointer-events-none transition-all duration-300"
          style={{
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
          }}
        />
      )}

      {/* Floating Instruction Card Dialog Panel */}
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 flex flex-col pointer-events-auto pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        style={tooltipStyle}
      >
        {/* Step details indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
            Step {currentStep} of {totalSteps - 1}
          </span>
          <button 
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
            title="Exit Walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">
          {stepTitle}
        </h3>

        {/* Small badge if tool selection applies */}
        {stepDescription && (
          <p className="text-xs font-semibold text-indigo-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
            {stepDescription}
          </p>
        )}

        {/* Detailed Explanation */}
        <div className="text-xs text-slate-600 leading-relaxed font-normal mb-6 max-h-[160px] overflow-y-auto pr-1">
          {stepLongDescription}
        </div>

        {/* Navigation Action Buttons footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 select-none">
          <div className="flex gap-1.5">
            <button
              onClick={onPrev}
              disabled={currentStep <= 1}
              className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded-xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onSkip}
              className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-50 rounded-xl"
            >
              Skip
            </button>
          </div>

          {!isLastStep ? (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onFinish(false)}
                className="px-3 py-2 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Clear Canvas
              </button>
              <button
                onClick={() => onFinish(true)}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100"
              >
                Keep Model <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
