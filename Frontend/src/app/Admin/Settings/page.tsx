"use client";
import { MessageCircle } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-8 border-b border-slate-200 pb-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Store Configuration
      </h2>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Store Name
            </label>
            <input
              type="text"
              defaultValue="ZeeF Trendy Store"
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Currency
              </label>
              <select className="w-full appearance-none rounded-xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15">
                <option>PKR (Rs)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="admin@zeeftrendy.com"
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              WhatsApp API Key{" "}
              <MessageCircle className="h-4 w-4 text-green-500" />
            </label>
            <input
              type="password"
              defaultValue="************************"
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button className="rounded-xl bg-[#0856DF] px-10 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8]">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
