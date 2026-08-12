'use client';

import { NirfReportPanel } from '@/components/ReportPanels';

export default function NirfReport() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <NirfReportPanel />
      </div>
    </div>
  );
}
