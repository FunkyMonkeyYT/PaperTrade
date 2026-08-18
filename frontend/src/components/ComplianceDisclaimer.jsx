import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ComplianceDisclaimer() {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-[#2A2E39] text-center transition-colors">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2.5 text-[11px] text-slate-500 dark:text-[#787B86] font-mono leading-relaxed">
        <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
        <span>
          <strong>DISCLAIMER:</strong> PaperTrade is a standalone simulation environment for algorithmic market research and educational purposes only. 
          Virtual cash and trades are not real financial executions. Mathematical metrics and quantitative indicators do not constitute financial advice.
        </span>
      </div>
    </footer>
  );
}
