import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Arrow, Circle as KonvaCircle, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Square, 
  Circle, 
  ArrowRight, 
  Trash2, 
  FileText, 
  Settings,
  Download,
  Share2,
  MousePointer2,
  Type as TypeIcon,
  Layers
} from 'lucide-react';
import { ElementType, LinkType, OPMElement, OPMLink, OPMModel } from './types';
import { generateOPL } from './services/oplService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [model, setModel] = useState<OPMModel>({
    elements: [],
    links: []
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'procedural' | ElementType | LinkType>('select');
  const [linkingSource, setLinkingSource] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 400, height: window.innerHeight - 64 });

  const stageRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      const sidebarWidth = 400;
      const toolbarWidth = 80;
      setStageSize({
        width: window.innerWidth - sidebarWidth - toolbarWidth,
        height: window.innerHeight - 64
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, selectedLinkId, model]);

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
      setSelectedLinkId(null);
      
      if (tool === ElementType.OBJECT || tool === ElementType.PROCESS) {
        const pos = stageRef.current.getPointerPosition();
        const defaultName = tool === ElementType.OBJECT ? 'New Object' : 'New Process';
        const name = window.prompt(`Enter name for ${tool.toLowerCase()}:`, defaultName) || defaultName;
        
        const newElement: OPMElement = {
          id: uuidv4(),
          type: tool as ElementType,
          name: name,
          x: pos.x - 60,
          y: pos.y - 35,
          width: tool === ElementType.OBJECT ? 120 : 140,
          height: tool === ElementType.OBJECT ? 60 : 70,
        };
        setModel(prev => ({
          ...prev,
          elements: [...prev.elements, newElement]
        }));
        setTool('select');
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedModel = JSON.parse(event.target?.result as string);
        setModel(importedModel);
      } catch (error) {
        console.error("Failed to import model:", error);
        alert("Invalid model file.");
      }
    };
    reader.readAsText(file);
  };

  const isValidLink = (sourceId: string, targetId: string, type: LinkType): boolean => {
    const source = model.elements.find(e => e.id === sourceId);
    const target = model.elements.find(e => e.id === targetId);
    if (!source || !target) return false;

    const sourceIsObject = source.type === ElementType.OBJECT;
    const sourceIsProcess = source.type === ElementType.PROCESS;
    const sourceIsState = source.type === ElementType.STATE;
    const targetIsObject = target.type === ElementType.OBJECT;
    const targetIsProcess = target.type === ElementType.PROCESS;
    const targetIsState = target.type === ElementType.STATE;

    switch (type) {
      case LinkType.AGENT:
      case LinkType.INSTRUMENT:
        return sourceIsObject && targetIsProcess;
      case LinkType.CONSUMPTION:
        return (sourceIsObject || sourceIsState) && targetIsProcess;
      case LinkType.RESULT:
        return sourceIsProcess && (targetIsObject || targetIsState);
      case LinkType.EFFECT:
        return (sourceIsProcess && (targetIsObject || targetIsState)) || 
               ((sourceIsObject || sourceIsState) && targetIsProcess);
      case LinkType.AGGREGATION:
      case LinkType.GENERALIZATION:
      case LinkType.INSTANTIATION:
        return (sourceIsObject && targetIsObject) || (sourceIsProcess && targetIsProcess);
      case LinkType.EXHIBITION:
        // Exhibition is the most flexible structural link
        return (sourceIsObject || sourceIsProcess) && (targetIsObject || targetIsProcess);
      default:
        return false;
    }
  };

  const handleElementClick = (id: string) => {
    if (tool === 'select') {
      setSelectedId(id);
      setSelectedLinkId(null);
    } else if (tool === 'procedural' || Object.values(LinkType).includes(tool as LinkType)) {
      if (!linkingSource) {
        setLinkingSource(id);
      } else {
        const source = model.elements.find(e => e.id === linkingSource);
        const target = model.elements.find(e => e.id === id);
        
        let linkType = tool as LinkType;
        if (tool === 'procedural') {
          if ((source?.type === ElementType.OBJECT || source?.type === ElementType.STATE) && target?.type === ElementType.PROCESS) {
            linkType = LinkType.CONSUMPTION;
          } else if (source?.type === ElementType.PROCESS && (target?.type === ElementType.OBJECT || target?.type === ElementType.STATE)) {
            linkType = LinkType.RESULT;
          } else {
            alert("Procedural links must connect an Object/State to a Process or vice versa.");
            setLinkingSource(null);
            setTool('select');
            return;
          }
        }

        if (linkingSource !== id && isValidLink(linkingSource, id, linkType)) {
          const newLink: OPMLink = {
            id: uuidv4(),
            type: linkType,
            sourceId: linkingSource,
            targetId: id
          };
          setModel(prev => ({
            ...prev,
            links: [...prev.links, newLink]
          }));
        } else if (linkingSource !== id) {
          alert(`Invalid link type for the selected elements.`);
        }
        setLinkingSource(null);
        setTool('select');
      }
    }
  };

  const handleDragEnd = (id: string, e: any) => {
    const { x, y } = e.target.attrs;
    setModel(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, x, y } : el)
    }));
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // reset scale
    node.scaleX(1);
    node.scaleY(1);

    setModel(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === node.id() ? {
        ...el,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, el.width * scaleX),
        height: Math.max(20, el.height * scaleY),
      } : el)
    }));
  };

  const updateLinkType = (id: string, type: LinkType) => {
    setModel(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, type } : l)
    }));
  };

  const updateElementName = (id: string, name: string) => {
    setModel(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, name } : el)
    }));
  };

  const addChild = (type: ElementType) => {
    if (!selectedId) return;
    const parent = model.elements.find(e => e.id === selectedId);
    if (!parent) return;

    const defaultName = type === ElementType.STATE ? 'New State' : 'New Subprocess';
    const name = window.prompt(`Enter name for ${type.toLowerCase()}:`, defaultName) || defaultName;

    const newChild: OPMElement = {
      id: uuidv4(),
      type: type,
      name: name,
      x: 10,
      y: 10,
      width: type === ElementType.STATE ? 60 : 80,
      height: type === ElementType.STATE ? 30 : 40,
      parentId: selectedId
    };

    setModel(prev => ({
      ...prev,
      elements: [...prev.elements, newChild]
    }));
  };

  const deleteSelected = () => {
    if (selectedId) {
      setModel(prev => ({
        elements: prev.elements.filter(el => el.id !== selectedId && el.parentId !== selectedId),
        links: prev.links.filter(l => l.sourceId !== selectedId && l.targetId !== selectedId)
      }));
      setSelectedId(null);
    } else if (selectedLinkId) {
      setModel(prev => ({
        ...prev,
        links: prev.links.filter(l => l.id !== selectedLinkId)
      }));
      setSelectedLinkId(null);
    }
  };

  const exportModel = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "opm-model.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const oplSentences = generateOPL(model);

  const getAbsolutePosition = (el: OPMElement) => {
    if (el.parentId) {
      const parent = model.elements.find(p => p.id === el.parentId);
      if (parent) {
        return {
          x: parent.x + el.x,
          y: parent.y + el.y,
          width: el.width,
          height: el.height
        };
      }
    }
    return { x: el.x, y: el.y, width: el.width, height: el.height };
  };

  const renderLink = (link: OPMLink) => {
    const sourceEl = model.elements.find(e => e.id === link.sourceId);
    const targetEl = model.elements.find(e => e.id === link.targetId);
    if (!sourceEl || !targetEl) return null;

    const sourcePos = getAbsolutePosition(sourceEl);
    const targetPos = getAbsolutePosition(targetEl);

    const fromX = link.sourceAnchor ? sourcePos.x + link.sourceAnchor.x * sourcePos.width : sourcePos.x + sourcePos.width / 2;
    const fromY = link.sourceAnchor ? sourcePos.y + link.sourceAnchor.y * sourcePos.height : sourcePos.y + sourcePos.height / 2;
    const toX = link.targetAnchor ? targetPos.x + link.targetAnchor.x * targetPos.width : targetPos.x + targetPos.width / 2;
    const toY = link.targetAnchor ? targetPos.y + link.targetAnchor.y * targetPos.height : targetPos.y + targetPos.height / 2;

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const isSelected = selectedLinkId === link.id;
    
    const snapToBoundary = (absX: number, absY: number, el: { x: number, y: number, width: number, height: number }, type: ElementType) => {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const dx = absX - cx;
    const dy = absY - cy;

    if (type === ElementType.OBJECT || type === ElementType.STATE) {
      // Snap to rectangle boundary
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const halfW = el.width / 2;
      const halfH = el.height / 2;

      if (absDx / halfW > absDy / halfH) {
        // Snap to left or right
        return {
          x: (dx > 0 ? halfW : -halfW) / el.width + 0.5,
          y: (dy * (halfW / absDx)) / el.height + 0.5
        };
      } else {
        // Snap to top or bottom
        return {
          x: (dx * (halfH / absDy)) / el.width + 0.5,
          y: (dy > 0 ? halfH : -halfH) / el.height + 0.5
        };
      }
    } else {
      // Snap to ellipse boundary
      const a = el.width / 2;
      const b = el.height / 2;
      const angle = Math.atan2(dy, dx);
      return {
        x: (a * Math.cos(angle)) / el.width + 0.5,
        y: (b * Math.sin(angle)) / el.height + 0.5
      };
    }
  };

  const handleAnchorDrag = (id: string, isSource: boolean, e: any) => {
    const { x: absX, y: absY } = e.target.attrs;
    const link = model.links.find(l => l.id === id);
    if (!link) return;

    const elId = isSource ? link.sourceId : link.targetId;
    const el = model.elements.find(e => e.id === elId);
    if (!el) return;

    const absPos = getAbsolutePosition(el);
    const snapped = snapToBoundary(absX, absY, absPos, el.type);
    
    setModel(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? {
        ...l,
        [isSource ? 'sourceAnchor' : 'targetAnchor']: snapped
      } : l)
    }));
  };

    const linkColor = isSelected ? '#4f46e5' : '#475569';
    const linkWidth = isSelected ? 3 : 2;

    const renderHandles = () => {
      if (!isSelected) return null;
      return (
        <Group>
          <KonvaCircle 
            x={fromX} y={fromY} radius={6} fill="white" stroke="#4f46e5" strokeWidth={2} draggable 
            onDragMove={(e) => handleAnchorDrag(link.id, true, e)} 
          />
          <KonvaCircle 
            x={toX} y={toY} radius={6} fill="white" stroke="#4f46e5" strokeWidth={2} draggable 
            onDragMove={(e) => handleAnchorDrag(link.id, false, e)} 
          />
        </Group>
      );
    };

    const commonProps = {
      onClick: (e: any) => { e.cancelBubble = true; setSelectedLinkId(link.id); setSelectedId(null); },
      stroke: linkColor,
      strokeWidth: linkWidth,
    };

    const renderCardinality = () => {
      return (
        <Group>
          {link.sourceCardinality && (
            <Text
              x={fromX + 15 * Math.cos(angle + Math.PI/4)}
              y={fromY + 15 * Math.sin(angle + Math.PI/4)}
              text={link.sourceCardinality}
              fontSize={12}
              fill="#475569"
            />
          )}
          {link.targetCardinality && (
            <Text
              x={toX - 25 * Math.cos(angle - Math.PI/4)}
              y={toY - 25 * Math.sin(angle - Math.PI/4)}
              text={link.targetCardinality}
              fontSize={12}
              fill="#475569"
            />
          )}
        </Group>
      );
    };

    // Procedural Links (Arrows)
    if (link.type === LinkType.CONSUMPTION || link.type === LinkType.RESULT || link.type === LinkType.EFFECT) {
      return (
        <Group key={link.id}>
          <Arrow
            points={[fromX, fromY, toX, toY]}
            {...commonProps}
            fill={linkColor}
            pointerLength={12}
            pointerWidth={10}
            pointerAtBeginning={link.type === LinkType.EFFECT}
          />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Agent Link
    if (link.type === LinkType.AGENT) {
      return (
        <Group key={link.id}>
          <Line points={[fromX, fromY, toX, toY]} {...commonProps} />
          <KonvaCircle x={toX - 6 * Math.cos(angle)} y={toY - 6 * Math.sin(angle)} radius={6} fill={linkColor} />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Instrument Link
    if (link.type === LinkType.INSTRUMENT) {
      return (
        <Group key={link.id}>
          <Line points={[fromX, fromY, toX, toY]} {...commonProps} />
          <KonvaCircle x={toX - 6 * Math.cos(angle)} y={toY - 6 * Math.sin(angle)} radius={6} stroke={linkColor} fill="white" strokeWidth={2} />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Structural Links (Triangles at source)
    if (link.type === LinkType.AGGREGATION || link.type === LinkType.EXHIBITION || link.type === LinkType.GENERALIZATION || link.type === LinkType.INSTANTIATION) {
      const triangleSize = 20;
      // In OPM, the triangle base is on the source boundary, and the apex points towards the target.
      const apexX = fromX + triangleSize * Math.cos(angle);
      const apexY = fromY + triangleSize * Math.sin(angle);
      
      return (
        <Group key={link.id}>
          <Line points={[apexX, apexY, toX, toY]} {...commonProps} />
          <Group x={fromX} y={fromY} rotation={(angle * 180) / Math.PI} onClick={commonProps.onClick}>
            <Line
              points={[0, 0, triangleSize, -triangleSize/2, triangleSize, triangleSize/2]}
              closed
              fill={link.type === LinkType.GENERALIZATION ? 'white' : linkColor}
              stroke={linkColor}
              strokeWidth={2}
            />
            {link.type === LinkType.EXHIBITION && (
              <Line points={[triangleSize/4, 0, triangleSize*0.8, -triangleSize/4, triangleSize*0.8, triangleSize/4]} closed fill="white" stroke={linkColor} strokeWidth={1} />
            )}
            {link.type === LinkType.INSTANTIATION && (
              <KonvaCircle x={triangleSize*0.6} radius={3} fill="white" />
            )}
          </Group>
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    return <Line key={link.id} points={[fromX, fromY, toX, toY]} {...commonProps} />;
  };

  const renderElement = (el: OPMElement) => {
    const isSelected = selectedId === el.id;
    const children = model.elements.filter(child => child.parentId === el.id);
    
    return (
      <Group 
        id={el.id}
        key={el.id} 
        x={el.x} 
        y={el.y} 
        draggable={tool === 'select'} 
        onDragEnd={(e) => {
          if (e.target.id() === el.id) {
            handleDragEnd(el.id, e);
          }
        }} 
        onClick={(e) => {
          e.cancelBubble = true;
          handleElementClick(el.id);
        }}
        onTransformEnd={handleTransformEnd}
      >
        {el.type === ElementType.OBJECT ? (
          <Rect 
            width={el.width} 
            height={el.height} 
            fill="white" 
            stroke={isSelected ? '#4f46e5' : '#1e293b'} 
            strokeWidth={isSelected ? 3 : 2} 
            cornerRadius={2} 
            shadowBlur={isSelected ? 15 : 0} 
            shadowColor="#4f46e5" 
            shadowOpacity={0.2} 
          />
        ) : el.type === ElementType.PROCESS ? (
          <Ellipse 
            radiusX={el.width / 2} 
            radiusY={el.height / 2} 
            x={el.width / 2} 
            y={el.height / 2} 
            fill="white" 
            stroke={isSelected ? '#4f46e5' : '#1e293b'} 
            strokeWidth={isSelected ? 3 : 2} 
            shadowBlur={isSelected ? 15 : 0} 
            shadowColor="#4f46e5" 
            shadowOpacity={0.2} 
          />
        ) : (
          <Group>
            {el.isFinal && (
              <Rect 
                width={el.width + 6} 
                height={el.height + 6} 
                x={-3}
                y={-3}
                fill="transparent" 
                stroke={isSelected ? '#4f46e5' : '#64748b'} 
                strokeWidth={1} 
                cornerRadius={10} 
              />
            )}
            <Rect 
              width={el.width} 
              height={el.height} 
              fill="white" 
              stroke={isSelected ? '#4f46e5' : '#64748b'} 
              strokeWidth={el.isInitial ? 3 : (isSelected ? 2 : 1)} 
              cornerRadius={8} 
            />
          </Group>
        )}
        <Text 
          text={el.name} 
          width={el.width} 
          height={el.height} 
          align="center" 
          verticalAlign="middle" 
          fontSize={el.parentId ? 10 : 14} 
          fontStyle={el.parentId ? "normal" : "bold"} 
          fill={el.type === ElementType.STATE ? "#475569" : "#1e293b"} 
          padding={5} 
        />
        {children.map(renderElement)}
      </Group>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <Settings className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">OPM-Pro v1</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm cursor-pointer border border-slate-200">
            <Share2 className="w-4 h-4" /> Import Model
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={exportModel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Download className="w-4 h-4" /> Export Model
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-4 shrink-0 shadow-sm overflow-y-auto">
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 className="w-5 h-5" />} label="Select" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton active={tool === ElementType.OBJECT} onClick={() => setTool(ElementType.OBJECT)} icon={<Square className="w-5 h-5" />} label="Object" />
          <ToolButton active={tool === ElementType.PROCESS} onClick={() => setTool(ElementType.PROCESS)} icon={<div className="w-6 h-4 border-2 border-slate-600 rounded-full" />} label="Process" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton active={tool === LinkType.AGENT} onClick={() => setTool(LinkType.AGENT)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full" /></div>} label="Agent" />
          <ToolButton active={tool === LinkType.INSTRUMENT} onClick={() => setTool(LinkType.INSTRUMENT)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full" />} label="Instrument" />
          <ToolButton active={tool === 'procedural'} onClick={() => setTool('procedural')} icon={<ArrowRight className="w-5 h-5" />} label="Procedural" />
          <ToolButton active={tool === LinkType.EFFECT} onClick={() => setTool(LinkType.EFFECT)} icon={<div className="flex items-center"><ArrowRight className="w-3 h-3 -mr-1" /><ArrowRight className="w-3 h-3 rotate-180" /></div>} label="Effect" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton active={tool === LinkType.AGGREGATION} onClick={() => setTool(LinkType.AGGREGATION)} icon={<div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-slate-600" />} label="Aggregation" />
          <ToolButton active={tool === LinkType.EXHIBITION} onClick={() => setTool(LinkType.EXHIBITION)} icon={<div className="relative w-4 h-4"><div className="absolute inset-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-slate-600" /><div className="absolute inset-[3px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-white" /></div>} label="Exhibition" />
          <ToolButton active={tool === LinkType.GENERALIZATION} onClick={() => setTool(LinkType.GENERALIZATION)} icon={<div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-slate-400" />} label="Generalization" />
          <ToolButton active={tool === LinkType.INSTANTIATION} onClick={() => setTool(LinkType.INSTANTIATION)} icon={<div className="relative w-4 h-4"><div className="absolute inset-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-slate-600" /><div className="absolute top-[6px] left-[3px] w-2 h-2 bg-white rounded-full" /></div>} label="Instantiation" />
          <div className="mt-auto pt-4 border-t border-slate-100 w-full flex flex-col items-center gap-4">
            <button onClick={() => setModel({ elements: [], links: [] })} className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Clear Canvas"><Plus className="w-5 h-5 rotate-45" /></button>
            <button onClick={deleteSelected} disabled={!selectedId} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-50 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <Stage width={stageSize.width} height={stageSize.height} onClick={handleStageClick} ref={stageRef}>
            <Layer>
              {model.elements.filter(el => !el.parentId).map(renderElement)}
              {model.links.map(renderLink)}
              {selectedId && tool === 'select' && (
                <Transformer
                  nodes={stageRef.current ? [stageRef.current.findOne('#' + selectedId)].filter(Boolean) : []}
                  padding={5}
                  rotateEnabled={false}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 40 || newBox.height < 40) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
          {linkingSource && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-pulse flex items-center gap-3 border border-indigo-400">
              <Plus className="w-4 h-4" /> Select target element to complete link
            </div>
          )}
        </main>

        <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Properties
            </h2>
            {selectedId ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Name</label>
                  <div className="relative group">
                    <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" value={model.elements.find(e => e.id === selectedId)?.name || ''} onChange={(e) => updateElementName(selectedId, e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Type</label>
                    <div className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200">
                      {model.elements.find(e => e.id === selectedId)?.type}
                    </div>
                  </div>
                  {model.elements.find(e => e.id === selectedId)?.type === ElementType.OBJECT && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Actions</label>
                      <button onClick={() => addChild(ElementType.STATE)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add State
                      </button>
                    </div>
                  )}
                  {model.elements.find(e => e.id === selectedId)?.type === ElementType.PROCESS && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Actions</label>
                      <button onClick={() => addChild(ElementType.PROCESS)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Subprocess
                      </button>
                    </div>
                  )}
                  {model.elements.find(e => e.id === selectedId)?.type === ElementType.STATE && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all">
                        <input 
                          type="checkbox" 
                          checked={model.elements.find(e => e.id === selectedId)?.isInitial || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setModel(prev => ({
                              ...prev,
                              elements: prev.elements.map(el => el.id === selectedId ? { ...el, isInitial: checked } : el)
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Initial State</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all">
                        <input 
                          type="checkbox" 
                          checked={model.elements.find(e => e.id === selectedId)?.isFinal || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setModel(prev => ({
                              ...prev,
                              elements: prev.elements.map(el => el.id === selectedId ? { ...el, isFinal: checked } : el)
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Final State</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedLinkId ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Link Type</label>
                  <select 
                    value={model.links.find(l => l.id === selectedLinkId)?.type}
                    onChange={(e) => updateLinkType(selectedLinkId, e.target.value as LinkType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <optgroup label="Structural">
                      <option value={LinkType.AGGREGATION}>Aggregation</option>
                      <option value={LinkType.EXHIBITION}>Exhibition</option>
                      <option value={LinkType.GENERALIZATION}>Generalization</option>
                      <option value={LinkType.INSTANTIATION}>Instantiation</option>
                    </optgroup>
                    <optgroup label="Procedural">
                      <option value={LinkType.AGENT}>Agent</option>
                      <option value={LinkType.INSTRUMENT}>Instrument</option>
                      <option value={LinkType.CONSUMPTION}>Consumption</option>
                      <option value={LinkType.RESULT}>Result</option>
                      <option value={LinkType.EFFECT}>Effect</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Source Cardinality</label>
                  <input 
                    type="text" 
                    value={model.links.find(l => l.id === selectedLinkId)?.sourceCardinality || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModel(prev => ({
                        ...prev,
                        links: prev.links.map(l => l.id === selectedLinkId ? { ...l, sourceCardinality: val } : l)
                      }));
                    }}
                    placeholder="e.g. 1, 0..*, n"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Target Cardinality</label>
                  <input 
                    type="text" 
                    value={model.links.find(l => l.id === selectedLinkId)?.targetCardinality || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModel(prev => ({
                        ...prev,
                        links: prev.links.map(l => l.id === selectedLinkId ? { ...l, targetCardinality: val } : l)
                      }));
                    }}
                    placeholder="e.g. 1, 0..*, n"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold border border-red-200">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Link
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <MousePointer2 className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-sm italic">Select an element on the canvas to view and edit its properties</p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Object Process Language (OPL)
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
              {oplSentences.length > 0 ? (
                oplSentences.map((sentence, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-sm leading-relaxed hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all cursor-default group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-indigo-400 font-mono mr-3 text-xs font-bold opacity-40 group-hover:opacity-100 transition-opacity">{String(i + 1).padStart(2, '0')}</span>
                    {sentence}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-sm italic">Add elements and links to generate natural language descriptions</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl transition-all group relative",
        active 
          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
      title={label}
    >
      {icon}
      {!active && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
          {label}
        </span>
      )}
    </button>
  );
}
