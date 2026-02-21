import React, { useState } from 'react';
import { Sparkles, X, FileJson, AlertCircle, Database, FileCode2 } from 'lucide-react';
import { sqlToER } from '../../utils/reverseEngineer';
import { autoLayout } from '../../utils/layout';

export default function ImportModal({ 
  isOpen, onClose, onImport, darkMode 
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('json'); // 'json' or 'sql'
  const [dialect, setDialect] = useState('postgresql');

  if (!isOpen) return null;

  const handleProcess = () => {
    try {
      let nodes = [];
      let edges = [];

      if (tab === 'json') {
        const data = JSON.parse(input);
        let entities = [];
        if (Array.isArray(data)) {
          entities = data;
        } else if (typeof data === 'object') {
          entities = Object.entries(data).map(([name, props]) => ({ name, ...props }));
        }

        nodes = entities.map((ent, i) => ({
          id: `node_gen_${Date.now()}_${i}`,
          name: ent.name || `entity_${i}`,
          shape: 'rectangle',
          x: 100 + (i % 3) * 250,
          y: 100 + Math.floor(i / 3) * 200,
          color: 'bg-[#bae6fd]',
          attributes: Object.entries(ent).filter(([k]) => k !== 'name' && typeof ent[k] !== 'object').map(([k, v], j) => ({
            id: `attr_${Date.now()}_${i}_${j}`,
            name: k,
            type: typeof v === 'number' ? 'INT' : 'VARCHAR(255)',
            isPK: k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id'),
            indent: 0
          }))
        }));
      } else {
        const result = sqlToER(input, dialect);
        nodes = result.nodes;
        edges = result.edges;
      }

      // Apply Auto Layout for better initial visual
      const laidOutNodes = autoLayout(nodes, edges);
      onImport(laidOutNodes, edges);
      onClose();
    } catch (err) {
      setError(err.message || "Invalid format. Please check your input.");
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className={`border ${darkMode ? 'bg-neutral-900 border-neutral-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-white border-neutral-200 shadow-2xl'} rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden transform transition-all`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-100' : 'border-neutral-100 bg-white text-neutral-800'}`}>
          <div className="flex items-center gap-2 font-bold text-lg"><Sparkles size={22} className="text-amber-500" /> AI-Assisted Import</div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className={`flex border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
          <button 
            onClick={() => setTab('json')} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === 'json' ? 'text-sky-500 border-b-2 border-sky-500 bg-sky-500/5' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <FileJson size={14} /> JSON Object
          </button>
          <button 
            onClick={() => setTab('sql')} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === 'sql' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <Database size={14} /> SQL Script
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {tab === 'json' ? 'Paste a JSON structure to generate a diagram.' : 'Paste SQL CREATE TABLE scripts to reverse engineer.'}
            </p>
            {tab === 'sql' && (
              <select 
                value={dialect} 
                onChange={(e) => setDialect(e.target.value)}
                className={`text-[10px] font-black uppercase border-none rounded-lg p-2 ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="oracle">Oracle</option>
              </select>
            )}
          </div>
          
          <textarea 
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            placeholder={tab === 'json' ? '[{"name": "User", "id": 1}]' : 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255)\n);'}
            className={`w-full h-64 font-mono text-sm p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
          />
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-lg text-sm border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${darkMode ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${darkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-200'} transition-colors`}>Cancel</button>
          <button onClick={handleProcess} className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg flex items-center gap-2 ${tab === 'json' ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}>
            {tab === 'json' ? <FileJson size={18} /> : <FileCode2 size={18} />}
            {tab === 'json' ? 'Generate JSON' : 'Reverse SQL'}
          </button>
        </div>
      </div>
    </div>
  );
}
