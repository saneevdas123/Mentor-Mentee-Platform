'use client';

import { NaacReportPanel } from '@/components/ReportPanels';

export default function NaacReport() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <NaacReportPanel />
      </div>
    </div>
  );
}
