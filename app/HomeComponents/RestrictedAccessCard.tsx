import { ShieldAlert } from "lucide-react";
import React from "react";

interface RestrictedProps {
  message: string;
}

const RestrictedAccessCard = ({ message }: RestrictedProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200/80 max-w-xl mx-auto my-8">
      <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
        <ShieldAlert size={28} />
      </div>
      <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide mb-1">
        Workspace Access Restricted
      </h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
        {message ||
          "You do not have the necessary permissions to access this section."}
      </p>
    </div>
  );
};

export default RestrictedAccessCard;
