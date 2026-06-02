import { Briefcase, Home, MapPin, User } from "lucide-react";
import { Invitation, LocationPair } from "../services/types";
import { formatDate, formatTime } from "../services/apis";
import { useUser } from "../UserContext";

/* eslint-disable @next/next/no-img-element */
interface InvitationDetailProps {
  invite: Invitation | null;
  onClose: () => void;
  statusDetails: {
    label: string;
    container: string;
    text: string;
  } | null;
}

const InvitationDetailModal = ({
  invite,
  onClose,
  statusDetails,
}: InvitationDetailProps) => {
  const { user } = useUser();
  if (!invite) return null;
  console.log("Invite:", invite);
  const isStaffEntry = invite.invite_type === "staff_entry";
  const estateLocations: LocationPair[] =
    user?.estate_id && invite.locations ? invite.locations[user.estate_id] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md lg:max-w-[60%] rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Status Bar */}
        <div
          className={`h-3 ${invite.is_cancelled ? "bg-rose-500" : invite.invite_type === "multi_entry" ? "bg-indigo-500" : "bg-emerald-500"}`}
        />

        <div className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-3 w-full justify-center items-center lg:items-start">
              {/* Image Container */}
              <div className="w-full max-w-[260px] lg:flex-1 lg:min-w-70 lg:max-w-[45%] bg-slate-100 rounded-[2rem] lg:rounded-[2.5rem] border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative aspect-square lg:aspect-auto">
                {invite.guest_image_url ? (
                  <img
                    src={invite.guest_image_url}
                    alt=""
                    className="w-full h-full lg:max-h-150 object-cover object-center"
                  />
                ) : (
                  <div className="text-slate-300 py-16 lg:py-20">
                    {isStaffEntry ? (
                      <Briefcase size={48} className="text-indigo-600/40" />
                    ) : (
                      <User size={52} className="text-indigo-600/40" />
                    )}
                  </div>
                )}
              </div>

              {/* Text/Content Area */}
              <div className="flex-1 w-full text-center lg:text-left">
                <h2
                  className={`text-xl lg:text-2xl font-montserrat font-black text-slate-900 break-words ${invite.is_cancelled ? "line-through opacity-50" : ""}`}
                >
                  {invite.guest_name}
                </h2>
                {isStaffEntry && invite.staff_position && (
                  <p className="font-sans font-bold text-xs mt-0.5 mb-0.5 text-slate-500">
                    💼 {invite.staff_position}
                  </p>
                )}
                <p className="text-xs font-oswald font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-4">
                  {invite.guest_phone}
                </p>
                <p className="text-xs font-oswald font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {invite.invite_type.replace("_", " ")}
                </p>

                {/* Status Badge */}
                {!isStaffEntry && (
                  <div
                    className={`${statusDetails?.container} px-4 py-1.5 rounded-full mb-6 lg:mb-8 w-fit mx-auto lg:mx-0`}
                  >
                    <span
                      className={`${statusDetails?.text} text-xs font-sans font-black`}
                    >
                      {statusDetails?.label}
                    </span>
                  </div>
                )}

                {isStaffEntry && (
                  <div
                    className={`px-2 py-2 m-2 rounded-md w-fit mx-auto lg:mx-0 ${
                      invite.is_activated ? "bg-emerald-100" : "bg-rose-100"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-oswald font-extrabold ${invite.is_activated ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {invite.is_activated
                        ? invite.status === "checked_in"
                          ? "INSIDE"
                          : invite.status === "checked_out"
                            ? "ACTIVE"
                            : invite.status === "overstayed"
                              ? "OVERSTAYED"
                              : "ACTIVE"
                        : "DISABLED"}
                    </p>
                  </div>
                )}

                {/* Location Details Subcard */}
                <div className="bg-slate-50 w-full rounded-[24px] lg:rounded-[30px] p-4 lg:p-5 mb-6 border border-slate-100 text-left">
                  <div className="flex items-center gap-1.5 justify-start lg:justify-start">
                    <Home size={16} className="text-indigo-500" />
                    <p className="text-[10px] text-slate-400 uppercase font-oswald font-bold tracking-wider">
                      Visiting Resident
                    </p>
                  </div>
                  <div className="mb-1">
                    <p className="text-gm-navy tracking-widest text-base font-sans font-bold">
                      {invite.resident_name || "Resident"}
                    </p>
                  </div>

                  <p className="text-[10px] text-indigo-600 uppercase mb-1 lg:ml-6 tracking-widest font-sans font-bold">
                    {invite.estate_name || "Estate Security"}
                  </p>
                  <p className="text-[10px] text-indigo-600 uppercase mb-1 lg:ml-6 tracking-widest font-sans font-medium">
                    {invite.estate_address || "Estate Security"}
                  </p>
                  <p className="text-[10px] text-indigo-600 uppercase mb-3 lg:ml-6 tracking-widest font-sans font-medium">
                    {invite.town} / {invite.lga}
                  </p>

                  {estateLocations && estateLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2 w-full">
                      {estateLocations.map((loc, idx) => {
                        const unitsString = Array.isArray(loc.unit)
                          ? loc.unit.join(", ")
                          : typeof loc.unit === "string"
                            ? loc.unit
                            : "N/A";

                        return (
                          <div
                            key={`detail-loc-${idx}`}
                            className="border bg-indigo-50/90 border-indigo-100 px-3 py-1.5 rounded-xl flex items-center"
                          >
                            <p className="font-sans font-black text-xs text-indigo-950">
                              Blk {loc.block}{" "}
                              <span className="text-slate-300">|</span> Unit(s):{" "}
                              {unitsString}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center p-3 rounded-2xl border bg-white border-slate-100">
                      <MapPin size={14} className="text-slate-400" />
                      <p className="text-gray-400 text-xs ml-2 italic font-sans">
                        No locations assigned
                      </p>
                    </div>
                  )}
                </div>

                {/* Big Access Code Area */}
                <div
                  className={`w-full ${invite.is_cancelled ? "bg-slate-100" : "bg-slate-900"} rounded-3xl lg:rounded-4xl py-6 lg:py-8 mb-6 lg:mb-8 text-center`}
                >
                  <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Access Code
                  </p>
                  <div
                    className={`text-3xl lg:text-5xl font-mono font-black tracking-widest ${invite.is_cancelled ? "text-slate-300 line-through" : "text-white"}`}
                  >
                    {invite.access_code}
                  </div>
                </div>

                {/* Validity Logs */}
                <div className="w-full space-y-3 lg:space-y-4 px-1 lg:px-2 text-left">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 text-sm font-sans italic">
                      Validity
                    </span>
                    <span className="text-slate-700 font-sans font-bold text-sm">
                      {(() => {
                        const isStaffEntry =
                          invite.invite_type === "staff_entry";
                        const startStr = formatDate(invite.start_date);
                        const hasEndDate =
                          invite.end_date !== null &&
                          invite.end_date !== undefined &&
                          invite.end_date !== "null" &&
                          invite.end_date !== invite.start_date;

                        if (hasEndDate) {
                          return `${startStr} → ${formatDate(invite.end_date)}`;
                        }
                        if (isStaffEntry && !hasEndDate) {
                          return `${startStr} → Present Date`;
                        }
                        return startStr;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 text-sm font-sans italic">
                      Daily Time
                    </span>
                    <span className="text-slate-900 font-sans font-bold text-sm">
                      {formatTime(invite.start_time)} -{" "}
                      {formatTime(invite.end_time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-6 lg:mt-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans font-bold py-4 rounded-2xl transition-colors text-sm lg:text-base active:scale-[0.99]"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetailModal;
