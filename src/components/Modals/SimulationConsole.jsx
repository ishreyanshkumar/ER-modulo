import React, { useState, useEffect } from 'react';
import { Play, X, RotateCcw, Table as TableIcon, Terminal } from 'lucide-react';
import { initSimulation, runQuery, resetSimulation } from '../../utils/simulation';
import { buildSchema, buildSQLText } from '../../utils/compiler';

export default function SimulationConsole({ 
  nodes, edges, isOpen, onClose, darkMode = false 
}) {
  const [query, setQuery] = useState('SELECT * FROM sqlite_master WHERE type="table";');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleInitialize();
    }
    return () => resetSimulation();
  }, [isOpen]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      // Generate SQLite compatible DDL (using 'sqlite' dialect from our compiler)
      const schema = buildSchema(nodes, edges, 'method1');
      const sqlText = buildSQLText(schema, 'sqlite');
      
      const res = await initSimulation(sqlText);
      if (!res.success) {
        setError("Failed to initialize database: " + res.error);
      }
    } catch (err) {
      setError("Initialization error: " + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRun = () => {
    setError(null);
    const res = runQuery(query);
    if (res.error) {
      setError(res.error);
      setResults(null);
    } else {
      setResults(res);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className={`mx-auto max-w-6xl w-full ${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'} border-t shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden flex flex-col h-[400px]`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-3 border-b ${darkMode ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'}`}>
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-sky-600">
            <Terminal size={18} /> 
            <span>SQL INTERACTIVE SIMULATION</span>
            {isInitializing && <span className="text-[10px] animate-pulse text-neutral-400 ml-2">(Initializing WASM...)</span>}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleInitialize} title="Reset Database" className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}>
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Editor Area */}
          <div className={`w-1/3 border-r ${darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-100 bg-neutral-50'} flex flex-col`}>
             <div className="flex-1 p-4">
               <textarea 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className={`w-full h-full bg-transparent border-none outline-none resize-none font-mono text-xs leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}
                 placeholder="Type your SQL query here..."
               />
             </div>
             <div className="p-4 border-t border-neutral-800 flex justify-end">
               <button 
                 onClick={handleRun}
                 disabled={isInitializing}
                 className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
               >
                 <Play size={14} fill="currentColor" /> RUN QUERY
               </button>
             </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black/20">
            {error ? (
              <div className="p-6 text-red-500 font-mono text-xs bg-red-500/5 h-full">
                <span className="font-bold uppercase block mb-2">[Query Error]</span>
                {error}
              </div>
            ) : (results && Array.isArray(results.columns) && Array.isArray(results.values)) ? (
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {results.columns.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr>
                        {results.columns.map(col => (
                          <th key={col} className={`p-2 border-b-2 ${darkMode ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-500'} font-black uppercase`}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.values.map((row, i) => (
                        <tr key={i} className={`${darkMode ? 'hover:bg-neutral-800/30' : 'hover:bg-sky-50/50'} transition-colors`}>
                          {row && Array.isArray(row) && row.map((val, j) => (
                            <td key={j} className={`p-2 border-b ${darkMode ? 'border-neutral-800/50 text-neutral-300' : 'border-neutral-100 text-neutral-700'}`}>
                              {val === null || val === undefined ? 'NULL' : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={`h-full flex flex-col items-center justify-center ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} gap-3 opacity-60`}>
                    <TableIcon size={32} />
                    <p>Query executed successfully (no rows returned).</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`h-full flex flex-col items-center justify-center ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} gap-3 opacity-30`}>
                <TableIcon size={32} />
                <p>Run a query to see results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
