import React, { useState } from 'react';
import { Button } from './Button';
import { Copy, Download, Check } from 'lucide-react';

interface OutputDisplayProps {
  content: string;
  term: string;
  onDownload?: () => void;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, term, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    // Sanitize term for filename
    const filename = term.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
    element.download = filename;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Generated Output
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy} 
            className="text-xs px-2 py-1"
            title="Copy to Clipboard"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload} 
            className="text-xs px-2 py-1"
            title="Download .md file"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-0 relative group">
        <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap h-full">
          {content}
        </pre>
      </div>
    </div>
  );
};