"use client"
import { BarChart3, MessageCircle } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="max-w-4xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h2 className="text-3xl font-black uppercase tracking-tight mb-8 pb-6 border-b-4 border-black">
        Store Configuration
      </h2>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
              Store Name
            </label>
            <input
              type="text"
              defaultValue="ZeeF Trendy Store"
              className="w-full border-2 border-black p-4 font-bold text-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                Currency
              </label>
              <select className="w-full border-2 border-black p-4 font-bold text-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all uppercase appearance-none bg-white">
                <option>PKR (Rs)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="admin@zeeftrendy.com"
                className="w-full border-2 border-black p-4 font-bold text-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all uppercase"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2 flex items-center gap-2">
              WhatsApp API Key{" "}
              <MessageCircle className="w-4 h-4 text-green-500" />
            </label>
            <input
              type="password"
              defaultValue="************************"
              className="w-full border-2 border-black p-4 font-bold text-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-6 border-t-4 border-black flex justify-end">
          <button className="border-2 border-black bg-black text-white hover:bg-white hover:text-black px-10 py-4 font-black uppercase tracking-widest text-sm transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};


export default SettingsPage;
