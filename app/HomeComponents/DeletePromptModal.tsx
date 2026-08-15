import React from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

interface DeletePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  message: string;
}

export const DeletePromptModal: React.FC<DeletePromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
      <div className="bg-white rounded-4xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert size={32} />
        </div>

        <h3 className="text-xl sm:text-2xl font-montserrat font-black text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-slate-500 font-sans text-sm leading-relaxed mb-8">
          This action is{" "}
          <span className="font-bold text-slate-900 underline">
            irreversible
          </span>
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-sans font-bold text-base sm:text-lg shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Yes, Terminate Everything"
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-oswald font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors cursor-pointer"
          >
            Cancel and Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
