import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PageHeader = ({ title, backTo, action }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-white border-b">
      <div className="max-w-xl mx-auto flex items-center h-14 px-4 gap-2">
        {backTo !== false && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="p-1 -ml-1 text-n-600 active:text-n-900"
            aria-label="Indietro"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="flex-1 text-base font-semibold text-n-900 truncate">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
