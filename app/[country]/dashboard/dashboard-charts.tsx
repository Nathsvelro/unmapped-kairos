"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CommonDict } from "@/packages/core/i18n";

interface SectorRow {
  yoy_change_pct: number;
  share_of_employment_pct: number;
  isic: string;
  notes?: string;
}

interface EducationDistribution {
  no_education: number;
  primary_completed: number;
  lower_secondary_completed: number;
  upper_secondary_completed: number;
  post_secondary_completed: number;
}

interface CountryProjection {
  "2025": EducationDistribution;
  "2030": EducationDistribution;
  "2035": EducationDistribution;
}

export function DashboardCharts({
  sectorEmployment,
  wittgenstein,
  dict,
}: {
  sectorEmployment: Record<string, SectorRow>;
  wittgenstein: CountryProjection;
  dict: CommonDict;
}) {
  const sectorData = Object.entries(sectorEmployment)
    .map(([k, v]) => ({
      sector: humanize(k),
      growth: v.yoy_change_pct,
      share: v.share_of_employment_pct,
    }))
    .sort((a, b) => b.growth - a.growth);

  const projectionYears: Array<keyof CountryProjection> = [
    "2025",
    "2030",
    "2035",
  ];
  const projectionData = projectionYears.map((y) => ({
    year: y,
    "No education": wittgenstein[y].no_education,
    Primary: wittgenstein[y].primary_completed,
    "Lower sec.": wittgenstein[y].lower_secondary_completed,
    "Upper sec.": wittgenstein[y].upper_secondary_completed,
    "Post-sec.": wittgenstein[y].post_secondary_completed,
  }));

  return (
    <>
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-stone-900">
          {dict.dashboard.skillSupplyDemand}
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Year-over-year change in employment, by sector. Data360 / ILO 2023.
        </p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="sector"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{
                  value: "% YoY",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                formatter={(v) => [
                  `${typeof v === "number" ? v.toFixed(1) : v}%`,
                  "YoY",
                ]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="growth">
                {sectorData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.growth >= 0 ? "#15803d" : "#c2410c"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-stone-900">
          {dict.dashboard.educationProjection}
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Population aged 20-29 by educational attainment, in millions. SSP2
          scenario. Source: Wittgenstein Centre Human Capital Data Explorer.
        </p>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{
                  value: "millions",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="No education"
                stroke="#c2410c"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Primary"
                stroke="#a16207"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Lower sec."
                stroke="#0369a1"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Upper sec."
                stroke="#1f5f8b"
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="Post-sec."
                stroke="#15803d"
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}

function humanize(s: string): string {
  return s
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
