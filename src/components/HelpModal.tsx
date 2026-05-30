import React from 'react';
import { X, Book, Layers, GitBranch, Info, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial?: () => void;
}

export default function HelpModal({ isOpen, onClose, onStartTutorial }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Book className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">OPM-Pro User Manual</h2>
              <p className="text-sm text-slate-500 font-medium">Mastering Object-Process Methodology</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Interactive Step-by-Step Tutorial Option */}
          {onStartTutorial && (
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-100/40 rounded-3xl border border-indigo-150/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-extrabold text-indigo-950 flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  🚀 New: Step-By-Step Interactive Tutorial
                </h4>
                <p className="text-xs text-indigo-700/80 max-w-xl font-medium leading-relaxed">
                  Learn OPM by building an <strong>Automated Espresso Maker</strong> right on your canvas with real-time annotations on exactly what to input and click!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onStartTutorial();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 transition-all hover:scale-105 select-none active:scale-95 shrink-0"
              >
                Launch Tutorial Walkthrough
              </button>
            </div>
          )}

          {/* Introduction */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" /> Introduction
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                Welcome to <strong>OPM-Pro</strong>, a professional modeling tool for <strong>Object-Process Methodology (OPM)</strong>. 
                OPM is a holistic approach to systems modeling that integrates the function, structure, and behavior of a system 
                within a single, unified framework.
              </p>
              <p>
                In OPM, everything is either an <strong>Object</strong> (a thing that exists) or a <strong>Process</strong> (a thing that happens to objects).
              </p>
            </div>
          </section>

          {/* Core Elements */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" /> Core Elements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white border-2 border-slate-800 rounded-sm mb-3 mx-auto" />
                <h4 className="font-bold text-slate-900 text-center mb-2">Object</h4>
                <p className="text-xs text-slate-500 text-center">A thing that exists, or can exist, physically or informatically.</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-8 bg-white border-2 border-slate-800 rounded-full mb-3 mx-auto" />
                <h4 className="font-bold text-slate-900 text-center mb-2">Process</h4>
                <p className="text-xs text-slate-500 text-center">A thing that happens to an object and transforms it.</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-6 bg-white border border-slate-400 rounded-lg mb-3 mx-auto flex items-center justify-center text-[8px] text-slate-400">STATE</div>
                <h4 className="font-bold text-slate-900 text-center mb-2">State</h4>
                <p className="text-xs text-slate-500 text-center">A situation at which an object can exist for some time.</p>
              </div>
            </div>
          </section>

          {/* Links */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-500" /> Links & Relations
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-sm mb-2">Procedural Links</h4>
                <p className="text-sm text-indigo-700">Connect objects to processes to describe behavior (Agent, Instrument, Consumption, Result, Effect).</p>
                <div className="mt-2 pt-2 border-t border-indigo-100">
                  <p className="text-xs text-indigo-800 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Invocation Link
                  </p>
                  <p className="text-xs text-indigo-600">Connects a source Process to a target Process. The source triggers the target.</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-amber-900 text-sm mb-2">Control Links</h4>
                <p className="text-sm text-amber-700">Special procedural links that define conditional or event-driven behavior (Condition, Event, Exception).</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 text-sm mb-2">Structural Links</h4>
                <p className="text-sm text-emerald-700">Connect elements of the same type to describe hierarchy and taxonomy (Aggregation, Exhibition, Generalization, Instantiation).</p>
              </div>
            </div>
          </section>

          {/* Interactive Step-by-Step Guide */}
          <section className="border-t border-slate-100 pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Book className="w-5 h-5 text-indigo-500" /> Step-By-Step Application Walkthrough
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Add Core Objects & Processes</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select <strong>Object</strong> (rectangle) or <strong>Process</strong> (ellipse) from the left toolbar, then click anywhere on the canvas to place it and give it a name.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Refine Properties & Configure States</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Click any element and locate the <strong>Right Sidebar</strong>. For Objects, click <strong>+ State</strong> to create states, and mark them as Initial, Final, or Default.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Draw Behavior or Structural Links</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select a link tool from the left toolbar. Click the <strong>source element</strong> first, then click the <strong>target element</strong> to generate the connection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">4</div>
                  <div>
                    <h4 className="font-bold text-indigo-800">In-Zoom Processes & Nesting</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      To detail how a process works, double-click a process or click <strong>Zoom In</strong> in its sidebar. Inside the new view, you can place subprocesses in sequential vertical order.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">5</div>
                  <div>
                    <h4 className="font-bold text-indigo-800">Import Existing Entities</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Click <strong>Add Existing</strong> in the toolbar. Select multiple elements and relations to reuse them across multiple OPDs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">6</div>
                  <div>
                    <h4 className="font-bold text-indigo-800">Use Smart Layout & Undo/Redo</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Click <strong>Auto Layout</strong> in the top header to automatically arrange your diagrams vertically. Use the <strong>Undo</strong> and <strong>Redo</strong> actions to freely modify your layout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                <strong>Pro-Tip:</strong> The live-generated <strong>Object-Process Language (OPL)</strong> sentences on the right panel instantly update with every diagram change. If you connect an object of a state with a process using an <i>agent</i> link, the text will syntactically align itself, ensuring immediate visual/verbal correctness!
              </p>
            </div>
          </section>

          {/* Metamodel Diagram */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center text-[10px] text-white font-bold">M2</div>
              Underlying Metamodel (MOF/ECORE)
            </h3>
            <div className="bg-slate-900 rounded-3xl p-8 overflow-x-auto border border-slate-800 shadow-inner">
              <MetamodelDiagram />
            </div>
            <p className="mt-4 text-sm text-slate-500 italic text-center">
              The diagram above illustrates the abstract syntax of OPM-Pro, following the MOF (Meta-Object Facility) standard.
            </p>
          </section>

          {/* Copyright Section */}
          <section className="border-t border-slate-100 pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              ⚖️ License & Attribution
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>OPM-Pro</strong> is Copyright © 2026 <strong>Avi Shaked</strong>.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to the following condition:
            </p>
            <p className="text-xs text-indigo-700 font-semibold leading-relaxed mt-1">
              "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software, with attribution credited to Avi Shaked."
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function MetamodelDiagram() {
  return (
    <svg width="800" height="500" viewBox="0 0 800 500" className="mx-auto">
      {/* Definitions */}
      <defs>
        <marker id="diamond" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 5 L 5 0 L 10 5 L 5 10 Z" fill="white" stroke="#6366f1" />
        </marker>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="none" stroke="#6366f1" />
        </marker>
      </defs>

      {/* Class: OPMModel */}
      <g transform="translate(300, 50)">
        <rect width="200" height="80" fill="#1e293b" stroke="#6366f1" strokeWidth="2" rx="4" />
        <line x1="0" y1="30" x2="200" y2="30" stroke="#6366f1" strokeWidth="1" />
        <text x="100" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">OPMModel</text>
        <text x="10" y="50" fill="#94a3b8" fontSize="11">elements: OPMElement[*]</text>
        <text x="10" y="65" fill="#94a3b8" fontSize="11">links: OPMLink[*]</text>
      </g>

      {/* Class: OPMElement */}
      <g transform="translate(50, 250)">
        <rect width="220" height="180" fill="#1e293b" stroke="#6366f1" strokeWidth="2" rx="4" />
        <line x1="0" y1="30" x2="220" y2="30" stroke="#6366f1" strokeWidth="1" />
        <text x="110" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">OPMElement</text>
        <text x="10" y="50" fill="#94a3b8" fontSize="11">id: EString</text>
        <text x="10" y="65" fill="#94a3b8" fontSize="11">name: EString</text>
        <text x="10" y="80" fill="#94a3b8" fontSize="11">type: ElementType</text>
        <text x="10" y="95" fill="#94a3b8" fontSize="11">x: EDouble</text>
        <text x="10" y="110" fill="#94a3b8" fontSize="11">y: EDouble</text>
        <text x="10" y="125" fill="#94a3b8" fontSize="11">width: EDouble</text>
        <text x="10" y="140" fill="#94a3b8" fontSize="11">height: EDouble</text>
        <text x="10" y="155" fill="#94a3b8" fontSize="11">isInitial: EBoolean</text>
        <text x="10" y="170" fill="#94a3b8" fontSize="11">isFinal: EBoolean</text>
      </g>

      {/* Class: OPMLink */}
      <g transform="translate(530, 250)">
        <rect width="220" height="140" fill="#1e293b" stroke="#6366f1" strokeWidth="2" rx="4" />
        <line x1="0" y1="30" x2="220" y2="30" stroke="#6366f1" strokeWidth="1" />
        <text x="110" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">OPMLink</text>
        <text x="10" y="50" fill="#94a3b8" fontSize="11">id: EString</text>
        <text x="10" y="65" fill="#94a3b8" fontSize="11">type: LinkType</text>
        <text x="10" y="80" fill="#94a3b8" fontSize="11">sourceId: EString</text>
        <text x="10" y="95" fill="#94a3b8" fontSize="11">targetId: EString</text>
        <text x="10" y="110" fill="#94a3b8" fontSize="11">sourceCardinality: EString</text>
        <text x="10" y="125" fill="#94a3b8" fontSize="11">targetCardinality: EString</text>
      </g>

      {/* Relations */}
      {/* Model -> Element (Composition) */}
      <path d="M 300 90 L 160 90 L 160 250" fill="none" stroke="#6366f1" strokeWidth="1.5" markerStart="url(#diamond)" />
      <text x="170" y="105" fill="#6366f1" fontSize="10">elements</text>
      <text x="170" y="240" fill="#6366f1" fontSize="10">0..*</text>

      {/* Model -> Link (Composition) */}
      <path d="M 500 90 L 640 90 L 640 250" fill="none" stroke="#6366f1" strokeWidth="1.5" markerStart="url(#diamond)" />
      <text x="580" y="105" fill="#6366f1" fontSize="10">links</text>
      <text x="620" y="240" fill="#6366f1" fontSize="10">0..*</text>

      {/* Link -> Element (Reference) */}
      <path d="M 530 300 L 270 300" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrowhead)" />
      <text x="400" y="295" fill="#6366f1" fontSize="10" textAnchor="middle">source / target</text>

      {/* Element -> Element (Nesting/Parent) */}
      <path d="M 270 350 L 300 350 L 300 400 L 270 400" fill="none" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <text x="305" y="375" fill="#6366f1" fontSize="10">parent</text>

      {/* Enums */}
      <g transform="translate(350, 250)">
        <rect width="100" height="100" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="4" />
        <text x="50" y="15" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">«enumeration»</text>
        <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">ElementType</text>
        <text x="10" y="50" fill="#64748b" fontSize="9">OBJECT</text>
        <text x="10" y="65" fill="#64748b" fontSize="9">PROCESS</text>
        <text x="10" y="80" fill="#64748b" fontSize="9">STATE</text>
      </g>

      <g transform="translate(350, 370)">
        <rect width="110" height="120" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="4" />
        <text x="55" y="15" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">«enumeration»</text>
        <text x="55" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">LinkType</text>
        <text x="10" y="50" fill="#64748b" fontSize="8">AGENT, INSTRUMENT</text>
        <text x="10" y="65" fill="#64748b" fontSize="8">CONSUMPTION, RESULT</text>
        <text x="10" y="80" fill="#64748b" fontSize="8">EFFECT, CONDITION</text>
        <text x="10" y="95" fill="#64748b" fontSize="8">EVENT, EXCEPTION</text>
        <text x="10" y="110" fill="#64748b" fontSize="8">AGGREGATION, ...</text>
      </g>
    </svg>
  );
}
