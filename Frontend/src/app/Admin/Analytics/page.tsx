import { BarChart3 } from "lucide-react";

const AnalyticsPage = () => (
  <div className="h-96 border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-10 bg-zinc-50">
    <BarChart3 className="w-16 h-16 text-cyan-500 mb-4" />
    <h2 className="text-3xl font-black uppercase">Analytics Module</h2>
    <p className="font-bold text-zinc-500 uppercase tracking-widest mt-2">
      Integration Pending
    </p>
  </div>
);

export default AnalyticsPage;
