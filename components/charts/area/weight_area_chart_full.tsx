import { scaleTime, scaleLinear, line as d3line, max, area as d3area, curveMonotoneX } from "d3";

export type WeightAreaChartData = {
  date: Date;
  value: number;
};

interface WeightAreaChartFullProps {
  data: WeightAreaChartData[];
  colorClass?: string; // e.g. 'text-blue-200 dark:text-blue-400'
}

export function WeightAreaChartFull({ data, colorClass = "text-blue-200 dark:text-blue-400" }: WeightAreaChartFullProps) {
  if (!data || data.length === 0) return <div className="h-72 w-full flex items-center justify-center text-zinc-400">No data</div>;

  let xScale = scaleTime()
    .domain([data[0].date, data[data.length - 1].date])
    .range([0, 100]);

  let yScale = scaleLinear()
    .domain([0, max(data.map((d) => d.value)) ?? 0])
    .range([100, 0]);

  let line = d3line<WeightAreaChartData>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  let area = d3area<WeightAreaChartData>()
    .x((d) => xScale(d.date))
    .y0(yScale(0))
    .y1((d) => yScale(d.value))
    .curve(curveMonotoneX);

  let areaPath = area(data) ?? undefined;
  let d = line(data);

  if (!d) {
    return null;
  }

  return (
    <div className="relative h-72 w-full">
      <div
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {/* Chart area */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Area */}
          <path d={areaPath} className={colorClass} fill="currentColor" />

          {/* Line */}
          <path
            d={d}
            fill="none"
            className="text-gray-50 dark:text-zinc-800"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* X axis */}
        {data.map((day, i) => {
          // show 1 every x labels
          if (i % 6 !== 0 || i === 0 || i >= data.length - 3) return null;
          return (
            <div
              key={i}
              style={{
                left: `${xScale(day.date)}%`,
                top: "90%",
              }}
              className="absolute text-xs text-zinc-500 -translate-x-1/2"
            >
              {day.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          );
        })}
      </div>
      {/* Y axis */}
      {yScale
        .ticks(8)
        .map(yScale.tickFormat(8, "d"))
        .map((value, i) => {
          if (i < 1) return null;
          return (
            <div
              key={i}
              style={{
                top: `${yScale(+value)}%`,
                right: "3%",
              }}
              className="absolute text-xs tabular-nums text-zinc-400 -translate-y-1/2"
            >
              {value}
            </div>
          );
        })}
    </div>
  );
}
