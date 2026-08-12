'use client';

import { NbaReportPanel } from '@/components/ReportPanels';

export default function NbaReport() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <NbaReportPanel />
      </div>
    </div>
  );
}
