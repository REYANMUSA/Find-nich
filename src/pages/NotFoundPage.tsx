import React from 'react';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

interface NotFoundPageProps {
  onBack: () => void;
  onSearch: (query: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBack, onSearch }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
        <FileQuestion className="w-8 h-8 stroke-[1.5]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Page Not Found (404)
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          The link you followed does not exist on Find Niche, or the product may have been relocated or archived.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onBack}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <button
          onClick={() => onSearch('')}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span>Search Products</span>
        </button>
      </div>
    </div>
  );
};
