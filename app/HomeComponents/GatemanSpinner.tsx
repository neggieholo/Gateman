"use client";

const GateManSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Outer Ring */}
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-100 border-t-primary"></div>

        {/* Inner Pulse Icon (Represents a Secure Gate/Shield) */}
        <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GateManSpinner;
