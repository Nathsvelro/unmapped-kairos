import { NextResponse } from "next/server";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  wdiAdapter,
  informalityAdapter,
  sectorEmploymentAdapter,
  ituAdapter,
  wittgensteinAdapter,
  ilostatWagesAdapter,
} from "@/packages/adapters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  if (!country) {
    return NextResponse.json(
      { error: "country query param required" },
      { status: 400 },
    );
  }
  const id = normalizeCountryId(country);
  if (!id) {
    return NextResponse.json({ error: "Unknown country" }, { status: 400 });
  }

  const ctx = await loadCountryContext(id);
  const [wdi, informality, sectorEmployment, itu, wittgenstein, wages] =
    await Promise.all([
      wdiAdapter.fetch(id),
      informalityAdapter.fetch(id),
      sectorEmploymentAdapter.fetch(id),
      ituAdapter.fetch(id),
      wittgensteinAdapter.fetch(id),
      ilostatWagesAdapter.fetch(id),
    ]);

  return NextResponse.json({
    country: ctx,
    indicators: {
      neet_pct: wdi["SL.UEM.NEET.ZS"],
      wage_employment_pct: wdi["SL.EMP.WORK.ZS"],
      employment_to_population_pct: wdi["SL.EMP.TOTL.SP.ZS"],
      gdp_per_capita_usd: wdi["NY.GDP.PCAP.CD"],
      gdp_per_capita_growth_pct: wdi["NY.GDP.PCAP.KD.ZG"],
      informal_share_pct: informality.informal_share_pct,
      mobile_broadband_per_100: itu.mobile_broadband_subs_per_100,
      internet_users_pct: itu.internet_users_pct,
      ict_index_score: itu.ict_index_score,
    },
    sectorEmployment,
    educationProjection: wittgenstein,
    wages,
    sources: {
      wdi: { url: wdiAdapter.sourceUrl, year: wdiAdapter.dataYear },
      data360_informality: {
        url: informalityAdapter.sourceUrl,
        year: informalityAdapter.dataYear,
      },
      data360_sector_employment: {
        url: sectorEmploymentAdapter.sourceUrl,
        year: sectorEmploymentAdapter.dataYear,
      },
      itu: { url: ituAdapter.sourceUrl, year: ituAdapter.dataYear },
      wittgenstein: {
        url: wittgensteinAdapter.sourceUrl,
        year: wittgensteinAdapter.dataYear,
      },
      ilostat: {
        url: ilostatWagesAdapter.sourceUrl,
        year: ilostatWagesAdapter.dataYear,
      },
    },
  });
}
