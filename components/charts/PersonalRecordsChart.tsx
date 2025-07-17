"use client";

import { CSSProperties } from "react";
import { scaleTime, scaleLinear, max, line as d3_line, curveMonotoneX } from "d3";
import { ClientTooltip, TooltipContent, TooltipTrigger } from "./ClientTooltip";

interface PersonalRecordData {
  date: Date;
  weight: number;
  exerciseName: string;
}

interface PersonalRecordsChartProps {
  data: PersonalRecordData[];
  exerciseName: string;
}

export function PersonalRecordsChart({ data, exerciseName }: PersonalRecordsChartProps) {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <div className="relative h-72 w-full flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 text-lg">No data available</div>
          <div className="text-gray-400 text-sm mt-1">Select an exercise to view personal records</div>
        </div>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

  // If only one data point, show a single dot
  if (sortedData.length === 1) {
    return (
      <div className="relative h-72 w-full">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{exerciseName}</h3>
          <p className="text-sm text-gray-500">Personal Record</p>
        </div>
        <div
          className="relative h-64 w-full"
          style={
            {
              "--marginTop": "0px",
              "--marginRight": "8px",
              "--marginBottom": "25px",
              "--marginLeft": "25px",
            } as CSSProperties
          }
        >
          <div
            className="absolute inset-0
              h-[calc(100%-var(--marginTop)-var(--marginBottom))]
              w-[calc(100%-var(--marginLeft)-var(--marginRight))]
              translate-x-[var(--marginLeft)]
              translate-y-[var(--marginTop)]
              flex items-center justify-center
            "
          >
            <div className="text-center">
              <div className="w-4 h-4 bg-violet-400 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium">{sortedData[0].weight} lbs</div>
              <div className="text-xs text-gray-500">
                {sortedData[0].date.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create scales
  const xScale = scaleTime()
    .domain([sortedData[0].date, sortedData[sortedData.length - 1].date])
    .range([0, 100]);

  const yScale = scaleLinear()
    .domain([0, max(sortedData.map((d) => d.weight)) ?? 0])
    .range([100, 0]);

  // Create line generator
  const line = d3_line<PersonalRecordData>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.weight))
    .curve(curveMonotoneX);

  const d = line(sortedData);

  if (!d) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{exerciseName}</h3>
        <p className="text-sm text-gray-500">Personal Records Progress</p>
      </div>
      <div
        className="relative h-72 w-full"
        style={
          {
            "--marginTop": "0px",
            "--marginRight": "8px",
            "--marginBottom": "25px",
            "--marginLeft": "40px",
          } as CSSProperties
        }
      >
        {/* Y axis */}
        <div
          className="absolute inset-0
            h-[calc(100%-var(--marginTop)-var(--marginBottom))]
            w-[var(--marginLeft)]
            translate-y-[var(--marginTop)]
            overflow-visible
          "
        >
          {yScale
            .ticks(6)
            .map(yScale.tickFormat(6, "d"))
            .map((value, i) => (
              <div
                key={i}
                style={{
                  top: `${yScale(+value)}%`,
                  left: "0%",
                }}
                className="absolute text-xs tabular-nums -translate-y-1/2 text-gray-500 w-full text-right pr-2"
              >
                {value} lbs
              </div>
            ))}
        </div>

        {/* Chart area */}
        <div
          className="absolute inset-0
            h-[calc(100%-var(--marginTop)-var(--marginBottom))]
            w-[calc(100%-var(--marginLeft)-var(--marginRight))]
            translate-x-[var(--marginLeft)]
            translate-y-[var(--marginTop)]
            overflow-visible
          "
        >
          <svg
            viewBox="0 0 100 100"
            className="overflow-visible w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {yScale
              .ticks(6)
              .map(yScale.tickFormat(6, "d"))
              .map((active, i) => (
                <g
                  transform={`translate(0,${yScale(+active)})`}
                  className="text-zinc-300 dark:text-zinc-700"
                  key={i}
                >
                  <line
                    x1={0}
                    x2={100}
                    stroke="currentColor"
                    strokeDasharray="6,5"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}

            {/* Line */}
            <path
              d={d}
              fill="none"
              className="stroke-violet-400"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Circles and Tooltips */}
            {sortedData.map((point, index) => (
              <ClientTooltip key={index}>
                <TooltipTrigger>
                  <path
                    d={`M ${xScale(point.date)} ${yScale(point.weight)} l 0.0001 0`}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                    stroke="currentColor"
                    className="text-violet-300"
                  />
                  <g className="group/tooltip">
                    {/* Tooltip Line */}
                    <line
                      x1={xScale(point.date)}
                      y1={0}
                      x2={xScale(point.date)}
                      y2={100}
                      stroke="currentColor"
                      strokeWidth={1}
                      className="opacity-0 group-hover/tooltip:opacity-100 text-zinc-300 dark:text-zinc-700 transition-opacity"
                      vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: "none" }}
                    />
                    {/* Invisible area closest to a specific point for the tooltip trigger */}
                    <rect
                      x={(() => {
                        const prevX = index > 0 ? xScale(sortedData[index - 1].date) : xScale(point.date);
                        return (prevX + xScale(point.date)) / 2;
                      })()}
                      y={0}
                      width={(() => {
                        const prevX = index > 0 ? xScale(sortedData[index - 1].date) : xScale(point.date);
                        const nextX =
                          index < sortedData.length - 1 ? xScale(sortedData[index + 1].date) : xScale(point.date);
                        const leftBound = (prevX + xScale(point.date)) / 2;
                        const rightBound = (xScale(point.date) + nextX) / 2;
                        return rightBound - leftBound;
                      })()}
                      height={100}
                      fill="transparent"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium">{point.weight} lbs</div>
                    <div className="text-gray-500">
                      {point.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </TooltipContent>
              </ClientTooltip>
            ))}
          </svg>

          {/* X Axis labels */}
          <div className="translate-y-2">
            {sortedData.map((point, i) => {
              const isFirst = i === 0;
              const isLast = i === sortedData.length - 1;
              const isMax = point.weight === Math.max(...sortedData.map((d) => d.weight));
              if (!isFirst && !isLast && !isMax) return null;
              return (
                <div key={i} className="overflow-visible text-zinc-500">
                  <div
                    style={{
                      left: `${xScale(point.date)}%`,
                      top: "100%",
                      transform: `translateX(${
                        i === 0 ? "0%" : i === sortedData.length - 1 ? "-100%" : "-50%"
                      })`,
                    }}
                    className="text-xs absolute"
                  >
                    {point.date.toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 