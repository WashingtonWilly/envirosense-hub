import { DashboardLayout } from '@/components/DashboardLayout';
import { KpiGrid } from '@/components/KpiCards';
import { SensorGrid } from '@/components/SensorCards';
import { HistoricalCharts } from '@/components/HistoricalCharts';
import { AlertsPanel } from '@/components/AlertsPanel';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';
import { LayoutDashboard } from 'lucide-react';

const Index = () => {
  const { connected, readings, alerts, getHistoricalData } = useMqtt();

  const avgTemp = readings.DHT22_T?.value ?? 0;
  const avgHumidity = readings.DHT22_H?.value ?? 0;
  const airQuality = readings['MQ-135']?.value ?? 0;
  const activeDevices = DEVICES.filter(d => d.status === 'online').length;

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Vista general del sistema de monitoreo ambiental</p>
          </div>
        </div>

        {/* KPI Overview */}
        <KpiGrid
          avgTemp={avgTemp}
          avgHumidity={avgHumidity}
          airQuality={airQuality}
          activeDevices={activeDevices}
          totalAlerts={alerts.length}
          connected={connected}
        />

        {/* Real-time sensors */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Sensores en Tiempo Real</h2>
          </div>
          <SensorGrid readings={readings} />
        </div>

        {/* Charts & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HistoricalCharts getHistoricalData={getHistoricalData} />
          </div>
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
