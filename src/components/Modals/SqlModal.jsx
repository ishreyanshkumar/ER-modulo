import React from 'react';
import { Database, X } from 'lucide-react';
import { 
  buildSchema, buildSQLText, buildRelationalText, 
  renderHighlightedSQL, renderHighlightedSchema 
} from '../../utils/compiler';
import { generatePrisma, generateSequelize, generateSQLAlchemy } from '../../utils/ormGenerator';

export default function SqlModal({ 
  nodes, edges, sqlModalOpen, setSqlModalOpen, exportSettings, setExportSettings,
  darkMode = false 
}) {
  if (!sqlModalOpen) return null;

  const schema = buildSchema(nodes, edges, exportSettings.isaMethod);
  const sqlText = buildSQLText(schema, exportSettings.dialect);
  const relationalText = buildRelationalText(schema);

  let ormText = '';
  if (exportSettings.format === 'prisma') ormText = generatePrisma(nodes, edges);
  else if (exportSettings.format === 'sequelize') ormText = generateSequelize(nodes, edges);
  else if (exportSettings.format === 'sqlalchemy') ormText = generateSQLAlchemy(nodes, edges);

  const getActiveText = () => {
    if (exportSettings.format === 'sql') return sqlText;
    if (exportSettings.format === 'schema') return relationalText;
    return ormText;
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className={`border ${darkMode ? 'bg-neutral-900 border-neutral-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-white border-neutral-200 shadow-2xl'} rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden transform transition-all`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-100' : 'border-neutral-100 bg-white text-neutral-800'}`}>
          <div className="flex items-center gap-2 font-bold text-lg"><Database size={22} className="text-sky-600" /> Compiled Schema</div>
          <button onClick={() => setSqlModalOpen(false)} className="text-neutral-400 hover:text-neutral-800 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className={`flex items-center gap-4 ${darkMode ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'} px-6 py-3 border-b text-sm`}>
           <select 
             value={exportSettings.format} 
             onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})} 
             className={`border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-white border-neutral-300 text-neutral-700'} shadow-sm`}
           >
              <option value="sql">SQL DDL Script</option>
              <option value="schema">Relational Schema (Text)</option>
              <option value="prisma">Prisma Schema (.prisma)</option>
              <option value="sequelize">Sequelize (Node.js)</option>
              <option value="sqlalchemy">SQLAlchemy (Python)</option>
           </select>
           {exportSettings.format === 'sql' && (
             <select 
               value={exportSettings.dialect} 
               onChange={(e) => setExportSettings({...exportSettings, dialect: e.target.value})} 
               className={`border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-white border-neutral-300 text-neutral-700'} shadow-sm`}
             >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="oracle">Oracle</option>
                <option value="sqlite">SQLite</option>
             </select>
           )}
           <select 
             value={exportSettings.isaMethod} 
             onChange={(e) => setExportSettings({...exportSettings, isaMethod: e.target.value})} 
             className={`border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-white border-neutral-300 text-neutral-700'} shadow-sm`}
           >
              <option value="method1">ISA: Method 1 (Parent + Child Tables)</option>
              <option value="method2">ISA: Method 2 (Push-down to Children)</option>
           </select>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#1e1e1e] text-neutral-200">
          {exportSettings.format === 'sql' 
            ? <code dangerouslySetInnerHTML={renderHighlightedSQL(sqlText)} className="text-sm font-mono whitespace-pre-wrap selection:bg-sky-500/30 block" />
            : exportSettings.format === 'schema'
            ? <code dangerouslySetInnerHTML={renderHighlightedSchema(relationalText)} className="text-sm font-mono whitespace-pre-wrap selection:bg-sky-500/30 block" />
            : <code className="text-sm font-mono whitespace-pre-wrap selection:bg-sky-500/30 block">{ormText}</code>
          }
        </div>
        <div className={`p-4 border-t ${darkMode ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'} flex justify-end gap-3 shrink-0`}>
          <button onClick={() => setSqlModalOpen(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${darkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-200'} transition-colors`}>Close</button>
          <button onClick={() => { 
            const text = getActiveText();
            navigator.clipboard.writeText(text);
          }} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40">
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
