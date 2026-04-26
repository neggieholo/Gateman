import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="relative mb-8">
        {/* Large stylized 404 */}
        <h1 className="text-[12rem] font-black text-slate-50 leading-none select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center animate-bounce">
            <Search size={48} className="text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-3xl font-black text-slate-900 mb-4">
          Lost in the Estate?
        </h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s
          get you back to the dashboard.
        </p>

        <Link
          href="/home"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
