import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart, MapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  MarkLineComponent,
  VisualMapComponent,
  DatasetComponent,
  GeoComponent,
} from 'echarts/components';

let registered = false;

export function ensureEchartsRegistered(): void {
  if (registered) return;
  echarts.use([
    CanvasRenderer,
    LineChart,
    BarChart,
    PieChart,
    MapChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DataZoomComponent,
    TitleComponent,
    MarkLineComponent,
    VisualMapComponent,
    DatasetComponent,
    GeoComponent,
  ]);
  registered = true;
}

export { echarts };
