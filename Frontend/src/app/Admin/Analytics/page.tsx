import { BarChart3 } from "lucide-react";

const AnalyticsPage = () => (
  <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center shadow-sm">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
      <BarChart3 className="h-8 w-8 text-cyan-500" />
    </div>
    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
      Analytics Module
    </h2>
    <p className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">
      Integration Pending
    </p>
  </div>
);

export default AnalyticsPage;
