import { User } from "lucide-react";
import { Invitation } from "../types";

/* eslint-disable @next/next/no-img-element */
interface InvitationDetailProps {
  invite: Invitation | null,
  onClose: () => void,
  statusDetails: {
    label: string,
    container: string,
    text: string
  } | null
};

const InvitationDetailModal = ({ invite, onClose, statusDetails }: InvitationDetailProps) => {
  if (!invite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Status Bar */}
        <div className={`h-3 ${invite.is_cancelled ? 'bg-rose-500' : (invite.invite_type === 'multi_entry' ? 'bg-indigo-500' : 'bg-emerald-500')}`} />
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Enlarged Image */}
            <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] border-4 border-white shadow-lg overflow-hidden mb-6">
              {invite.guest_image_url ? (
                <img src={invite.guest_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                   <User size={48} />
                </div>
              )}
            </div>

            <h2 className={`text-2xl font-black text-slate-900 ${invite.is_cancelled ? 'line-through opacity-50' : ''}`}>
              {invite.guest_name}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {invite.invite_type.replace('_', ' ')}
            </p>

            {/* Status Badge */}
            <div className={`${statusDetails?.container} px-4 py-1.5 rounded-full mb-8`}>
              <span className={`${statusDetails?.text} text-xs font-black`}>
                {statusDetails?.label}
              </span>
            </div>

            {/* Big Access Code */}
            <div className={`w-full ${invite.is_cancelled ? 'bg-slate-100' : 'bg-slate-900'} rounded-[2rem] py-8 mb-8`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Access Code</p>
              <div className={`text-5xl font-mono font-black tracking-widest ${invite.is_cancelled ? 'text-slate-300 line-through' : 'text-white'}`}>
                {invite.access_code}
              </div>
            </div>

            {/* Dates/Times List */}
            <div className="w-full space-y-4 px-2">
               <div className="flex justify-between border-b border-slate-50 pb-2">
                 <span className="text-slate-400 text-sm italic">Validity</span>
                 <span className="text-slate-900 font-bold text-sm">
                   {invite.start_date} {invite.invite_type === 'multi_entry' && `to ${invite.end_date}`}
                 </span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                 <span className="text-slate-400 text-sm italic">Daily Time</span>
                 <span className="text-slate-900 font-bold text-sm">{invite.start_time} - {invite.end_time}</span>
               </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetailModal;