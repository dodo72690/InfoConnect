import React, { useRef, useEffect, useState } from 'react';
import { MemeState, MemeText } from '../types';
import { Move, Type as TypeIcon, Download, Wand2, Sparkles, Undo2 } from 'lucide-react';
import { editMemeImage } from '../services/geminiService';

interface MemeEditorProps {
  state: MemeState;
  setState: React.Dispatch<React.SetStateAction<MemeState>>;
  isGeneratingCaptions: boolean;
  onMagicCaption: () => void;
}

const MemeEditor: React.FC<MemeEditorProps> = ({ state, setState, isGeneratingCaptions, onMagicCaption }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Add a new text block
  const addText = () => {
    const newText: MemeText = {
      id: Date.now().toString(),
      content: 'EDIT TEXT',
      x: 50,
      y: state.texts.length === 0 ? 10 : 90, // Auto position top/bottom
      size: 40,
      color: '#FFFFFF'
    };
    setState(prev => ({ ...prev, texts: [...prev.texts, newText] }));
  };

  // Update specific text field
  const updateText = (id: string, updates: Partial<MemeText>) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  // Handle generative edit
  const handleImageEdit = async () => {
    if (!state.currentImage || !editPrompt.trim()) return;
    
    setIsEditingImage(true);
    try {
      const newImageBase64 = await editMemeImage(state.currentImage, editPrompt);
      setState(prev => ({ ...prev, currentImage: newImageBase64 }));
      setEditPrompt('');
    } catch (e) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsEditingImage(false);
    }
  };

  // Revert to original
  const handleRevert = () => {
    setState(prev => ({ ...prev, currentImage: prev.originalImage }));
  };

  // Download function using a temporary canvas
  const handleDownload = () => {
    if (!state.currentImage) return;

    const img = new Image();
    img.src = state.currentImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw Image
      ctx.drawImage(img, 0, 0);

      // Draw Text
      state.texts.forEach(text => {
        const x = (text.x / 100) * canvas.width;
        const y = (text.y / 100) * canvas.height;
        const fontSize = (text.size / 500) * canvas.width; // Scale font relative to image width roughly

        ctx.font = `900 ${fontSize}px Impact, sans-serif`;
        ctx.fillStyle = text.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize * 0.1;
        
        // Draw stroke and fill
        ctx.strokeText(text.content.toUpperCase(), x, y);
        ctx.fillText(text.content.toUpperCase(), x, y);
      });

      const link = document.createElement('a');
      link.download = `meme-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  if (!state.currentImage) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
        Select or upload an image to start editing
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2">
          <button 
            onClick={addText}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
          >
            <TypeIcon size={18} /> Add Text
          </button>
          <button 
            onClick={onMagicCaption}
            disabled={isGeneratingCaptions}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingCaptions ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Magic Caption
          </button>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
        >
          <Download size={18} /> Download
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden border border-slate-700 shadow-2xl">
          <div className="relative max-w-full max-h-full">
            <img 
              src={state.currentImage} 
              alt="Meme Canvas" 
              className="max-w-full max-h-[60vh] lg:max-h-[70vh] object-contain mx-auto"
            />
            {/* Text Overlays */}
            {state.texts.map(text => (
              <div
                key={text.id}
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${text.size * 0.8}px`, // Approximation for screen view
                  color: text.color,
                }}
                className="absolute font-meme uppercase tracking-wide cursor-move select-none whitespace-nowrap hover:scale-105 transition-transform"
                // In a real app, we'd add drag handlers here. For MVP, we use sliders in settings.
              >
                {text.content}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* AI Image Edit */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wand2 size={14} /> AI Image Editor
            </h3>
            <div className="space-y-3">
               <div className="relative">
                <input 
                    type="text" 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., Make it cyberpunk..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleImageEdit()}
                />
                <button 
                  onClick={handleImageEdit}
                  disabled={isEditingImage || !editPrompt}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold disabled:opacity-50"
                >
                  {isEditingImage ? '...' : 'GO'}
                </button>
               </div>
               {state.currentImage !== state.originalImage && (
                 <button 
                   onClick={handleRevert}
                   className="text-xs text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
                 >
                   <Undo2 size={12} /> Revert to original
                 </button>
               )}
            </div>
          </div>

          {/* Text Layers */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Text Layers</h3>
            {state.texts.map((text, idx) => (
              <div key={text.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-semibold text-slate-500">Layer {idx + 1}</span>
                   <button 
                     onClick={() => setState(prev => ({ ...prev, texts: prev.texts.filter(t => t.id !== text.id)}))}
                     className="text-slate-500 hover:text-red-400"
                   >
                     ×
                   </button>
                </div>
                <input 
                  type="text"
                  value={text.content}
                  onChange={(e) => updateText(text.id, { content: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 mb-3 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Vertical (Y)</label>
                    <input 
                      type="range" min="0" max="100" 
                      value={text.y} 
                      onChange={(e) => updateText(text.id, { y: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Size</label>
                    <input 
                      type="range" min="10" max="100" 
                      value={text.size} 
                      onChange={(e) => updateText(text.id, { size: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Color</label>
                    <input 
                       type="color"
                       value={text.color}
                       onChange={(e) => updateText(text.id, { color: e.target.value })}
                       className="w-full h-6 bg-transparent rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))}
            {state.texts.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4 italic">No text layers added.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeEditor;
