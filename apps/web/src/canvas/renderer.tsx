import type { Widget } from "@camaleon/shared";
import { ActionCardWidget, ProductWidget } from "./widgets/action";
import { BalanceWidget } from "./widgets/balance";
import {
  AlertWidget,
  ChecklistWidget,
  MetricWidget,
  ProgressWidget,
  TextWidget,
} from "./widgets/basic";
import { DailyWidget } from "./widgets/daily";
import { ChipsWidget, DonutWidget, TimelineWidget, TrendWidget } from "./widgets/data";
import { DestinationWidget } from "./widgets/destination";
import { GapWidget } from "./widgets/gap";
import { HealthWidget } from "./widgets/health";
import { HeroWidget } from "./widgets/hero";
import { ListingWidget } from "./widgets/listing";
import { MapaWidget } from "./widgets/mapa";
import { PathsWidget } from "./widgets/paths";
import { PlanWidget } from "./widgets/plan";
import { QuestionWidget } from "./widgets/question";
import { SimulatorWidget } from "./widgets/simulator";

/**
 * El único punto donde el catálogo se convierte en píxeles.
 * Si algún día el agente inventa un tipo que no existe, aquí no pasa nada:
 * devolvemos null y el lienzo sigue vivo.
 */
export function RenderWidget({ widget, onAsk }: { widget: Widget; onAsk: (q: string) => void }) {
  switch (widget.type) {
    case "hero":
      return <HeroWidget props={widget.props} />;
    case "metric":
      return <MetricWidget props={widget.props} />;
    case "gap":
      return <GapWidget props={widget.props} />;
    case "paths":
      return <PathsWidget props={widget.props} />;
    case "simulator":
      return <SimulatorWidget props={widget.props} />;
    case "donut":
      return <DonutWidget props={widget.props} onAsk={onAsk} />;
    case "trend":
      return <TrendWidget props={widget.props} />;
    case "timeline":
      return <TimelineWidget props={widget.props} />;
    case "checklist":
      return <ChecklistWidget props={widget.props} />;
    case "chips":
      return <ChipsWidget props={widget.props} onAsk={onAsk} />;
    case "actionCard":
      return <ActionCardWidget props={widget.props} />;
    case "alert":
      return <AlertWidget props={widget.props} onAsk={onAsk} />;
    case "product":
      return <ProductWidget props={widget.props} />;
    case "progress":
      return <ProgressWidget props={widget.props} onAsk={onAsk} />;
    case "text":
      return <TextWidget props={widget.props} />;
    case "balance":
      return <BalanceWidget props={widget.props} onAsk={onAsk} />;
    case "health":
      return <HealthWidget props={widget.props} onAsk={onAsk} />;
    case "daily":
      return <DailyWidget props={widget.props} onAsk={onAsk} />;
    case "question":
      return <QuestionWidget props={widget.props} onAsk={onAsk} />;
    case "listing":
      return <ListingWidget props={widget.props} onAsk={onAsk} />;
    case "mapa":
      return <MapaWidget props={widget.props} onAsk={onAsk} />;
    case "destination":
      return <DestinationWidget props={widget.props} onAsk={onAsk} />;
    case "plan":
      return <PlanWidget props={widget.props} />;
    default:
      return null;
  }
}
