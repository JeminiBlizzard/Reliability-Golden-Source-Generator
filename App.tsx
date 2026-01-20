import React, { useState, useCallback, useEffect } from 'react';
import { generateEncyclopediaEntry } from './services/geminiService';
import { GeneratorStatus, HistoryItem } from './types';
import { Button } from './components/Button';
import { OutputDisplay } from './components/OutputDisplay';
import { Database, Zap, BookOpen, AlertCircle, History, Key, Info, ExternalLink, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [term, setTerm] = useState('');
  const [draftDefinition, setDraftDefinition] = useState('');
  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hasSelectedKey, setHasSelectedKey] = useState<boolean>(false);

  const checkKeyStatus = useCallback(async () => {
    try {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasSelectedKey(selected);
      }
    } catch (e) {
      console.error("Failed to check key status", e);
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleOpenKeyDialog = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Force state update to reflect selection
        setHasSelectedKey(true);
        setError(null);
        // Re-check after a brief moment to sync with environment
        setTimeout(checkKeyStatus, 500);
      }
    } catch (e) {
      console.error("Failed to open key dialog", e);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!term.trim()) return;

    setStatus(GeneratorStatus.GENERATING);
    setError(null);
    setResult('');

    try {
      const generatedContent = await generateEncyclopediaEntry({ term, draftDefinition });
      setResult(generatedContent);
      setStatus(GeneratorStatus.SUCCESS);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        term: term,
        timestamp: Date.now(),
        content: generatedContent
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10));
    } catch (err: any) {
      console.error("Generation Error:", err);
      let errorMessage = err.message || "An unexpected error occurred.";
      
      if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
        try {
          const jsonMatch = errorMessage.match(/\{.*\}/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error?.message || errorMessage;
          }
        } catch (pErr) {}
      }

      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.toLowerCase().includes("quota")) {
        errorMessage = "Quota limit reached. While Gemini 3 Flash is more accessible, you may still need a personal API key from a project with billing enabled to handle continuous high-volume technical architecting.";
      }
      
      setError(errorMessage);
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setTerm(item.term);
    setResult(item.content);
    setStatus(GeneratorStatus.SUCCESS);
    setError(null);
  };

  const clearForm = useCallback(() => {
    setTerm('');
    setDraftDefinition('');
    setStatus(GeneratorStatus.IDLE);
    setResult('');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Golden Source</h1>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none mt-1">Data Architect • Powered by Gemini 3 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant={hasSelectedKey ? "ghost" : "primary"} 
              size="sm" 
              onClick={handleOpenKeyDialog}
              className={`text-xs h-9 ${!hasSelectedKey ? 'animate-pulse ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''}`}
              icon={<Key size={14} />}
            >
              {hasSelectedKey ? "API Key Connected" : "Connect Personal Key"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSelectedKey && (
          <div className="mb-8 bg-blue-900/10 border border-blue-800/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Optimize Your Experience</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-xl">
                  We've switched to <strong>Gemini 3 Flash</strong> for faster processing. Connect your personal API key to ensure you have the best availability for complex data architecture tasks.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button onClick={handleOpenKeyDialog} icon={<Key size={18} />}>
                Connect API Key
              </Button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                className="text-xs text-slate-500 hover:text-blue-400 text-center flex items-center justify-center gap-1"
              >
                API Key Help <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className={`bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl transition-all duration-300 ${!hasSelectedKey ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold text-white">Technical Definition</h2>
                </div>
                <div className="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded tracking-tighter">FLASH V3</div>
              </div>
              
              <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="term" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    Term Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. Asset Criticality"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="definition" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    Context / Draft
                  </label>
                  <textarea
                    id="definition"
                    value={draftDefinition}
                    onChange={(e) => setDraftDefinition(e.target.value)}
                    rows={6}
                    placeholder="Provide a draft or technical context..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    isLoading={status === GeneratorStatus.GENERATING}
                    icon={<Zap size={18} />}
                  >
                    Architect
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={clearForm}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </div>

            {history.length > 0 && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl flex-1 overflow-auto max-h-[400px]">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-slate-400" />
                  <h2 className="text-md font-semibold text-slate-200">History</h2>
                </div>
                <ul className="space-y-1">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all flex justify-between items-center group"
                      >
                        <span className="text-sm text-slate-400 group-hover:text-white truncate">{item.term}</span>
                        <span className="text-[10px] text-slate-600 font-mono">
                           {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
            {error && (
              <div className="mb-6 bg-red-950/20 border border-red-800/40 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-red-400">System Connection Error</h3>
                    <div className="text-sm text-red-200/90 mt-2 leading-relaxed whitespace-pre-wrap font-sans">
                      {error}
                    </div>
                    
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleOpenKeyDialog} 
                        className="text-xs bg-red-600 hover:bg-red-500 border-none shadow-lg shadow-red-900/20"
                        icon={<Key size={14} />}
                      >
                        Reconnect API Key
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleGenerate()} 
                        className="text-xs"
                        icon={<RefreshCw size={14} />}
                      >
                        Retry Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result ? (
              <OutputDisplay content={result} term={term} />
            ) : status === GeneratorStatus.GENERATING ? (
              <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <Database className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Standardizing Source Data...</h3>
                <p className="text-slate-400 max-w-sm text-sm font-medium">
                  Mapping attributes to ISO standards and structuring for vector ingestion.
                </p>
              </div>
            ) : (
              <div className={`flex-1 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500 p-12 text-center transition-opacity ${!hasSelectedKey ? 'opacity-30' : 'opacity-100'}`}>
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-3 tracking-tight">Golden Source Workbench</h3>
                <p className="max-w-md text-sm leading-relaxed mb-10">
                  Connect an API key and define a term to generate standardized maintenance data optimized for RAG systems.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-600">
                  <span className="bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full">ISO 14224</span>
                  <span className="bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full">RAG-READY</span>
                  <span className="bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full">GEMINI 3 FLASH</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;