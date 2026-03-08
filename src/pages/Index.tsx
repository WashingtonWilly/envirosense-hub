import { DashboardLayout } from '@/components/DashboardLayout';
import { KpiGrid } from '@/components/KpiCards';
import { SensorGrid } from '@/components/SensorCards';
import { HistoricalCharts } from '@/components/HistoricalCharts';
import { AlertsPanel } from '@/components/AlertsPanel';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';

const Index = () => {
  const { connected, readings, alerts, getHistoricalData } = useMqtt();

  const avgTemp = readings.DHT22_T?.value ?? 0;
  const avgHumidity = readings.DHT22_H?.value ?? 0;
  const airQuality = readings['MQ-135']?.value ?? 0;
  const activeDevices = DEVICES.filter(d => d.status === 'online').length;

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Estado general del sistema de monitoreo ambiental</p>
        </div>

        <KpiGrid
          avgTemp={avgTemp}
          avgHumidity={avgHumidity}
          airQuality={airQuality}
          activeDevices={activeDevices}
          totalAlerts={alerts.length}
          connected={connected}
        />

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Sensores en Tiempo Real</h2>
          <SensorGrid readings={readings} />
        </div>

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
