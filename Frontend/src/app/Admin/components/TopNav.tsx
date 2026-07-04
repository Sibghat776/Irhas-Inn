import { Bell, Menu, Search } from "lucide-react";

const TopNav = ({ title }: { title: string }) => {
  return (
    <header className="h-24 bg-white border-b-4 border-black flex items-center justify-between px-10 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Menu className="w-8 h-8 text-black cursor-pointer lg:hidden" />
        <h2 className="text-4xl font-black tracking-tight text-black uppercase">{title}</h2>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-96 pl-12 pr-4 py-3 bg-zinc-50 border-2 border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all text-sm font-bold text-black placeholder:text-zinc-400 uppercase"
          />
        </div>
        
        <button className="relative p-3 border-2 border-black hover:bg-black hover:text-white transition-colors text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 border-2 border-black"></span>
        </button>
      </div>
    </header>
  );
};

export default TopNav