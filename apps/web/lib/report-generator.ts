// General intelligence report generator.
//
// Reads the *reported* incidents (their type, location and the field officer's
// description) and produces a narrative report that highlights WHERE incidents
// are recurring (spatial hotspots) and WHAT measures should be taken for each
// kind of violation. Pure/deterministic — no external API needed, so it always
// works offline and on click.

export type ReportIncident = {
  id: string;
  type: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  ai_analysis?: { threat_level?: string; confidence_score?: number; ai_summary?: string } | null;
};

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  incidents: ReportIncident[];
  typeCounts: Record<string, number>;
};

const prettyType = (t: string) =>
  (t || "unknown").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Recommended counter-measures per violation type. Keyed by a normalized token
// found in the incident `type`.
const MEASURES: { match: (t: string) => boolean; label: string; measures: string[] }[] = [
  {
    match: (t) => t.includes("illegal") || t.includes("fish"),
    label: "Illegal Fishing",
    measures: [
      "Increase patrol frequency and randomize patrol timing in this zone.",
      "Deploy or cross-check VMS/AIS vessel tracking for vessels operating here.",
      "Conduct at-sea boarding and catch inspections on suspect vessels.",
      "Coordinate with the coast guard / fisheries authority for rapid interdiction.",
      "Verify catch documentation and licences against the national registry.",
    ],
  },
  {
    match: (t) => t.includes("unauthor") || t.includes("vessel"),
    label: "Unauthorized Vessel",
    measures: [
      "Intercept and board for documentation and registration checks.",
      "Strengthen AIS/radar tracking and flag vessels with no transponder signal.",
      "Issue formal warnings and escalate repeat offenders to enforcement.",
      "Maintain a watch-list of vessels repeatedly sighted in the zone.",
    ],
  },
  {
    match: (t) => t.includes("gear"),
    label: "Gear Violation",
    measures: [
      "Confiscate prohibited or non-compliant fishing gear on sight.",
      "Enforce mesh-size and gear-type regulations through spot inspections.",
      "Run community outreach on compliant gear to reduce repeat violations.",
    ],
  },
  {
    match: (t) => t.includes("protect") || t.includes("intrusion") || t.includes("area"),
    label: "Protected Area Intrusion",
    measures: [
      "Deploy boundary patrols and install geofencing alerts on the MPA edge.",
      "Increase surveillance coverage (drones/aerial) over the protected zone.",
      "Prosecute repeat intruders and publicize enforcement to deter others.",
    ],
  },
];

const GENERIC_MEASURES = [
  "Increase monitoring and document all sightings with time-stamped GPS.",
  "Deploy patrol assets to the affected zone and log response times.",
  "Escalate recurring activity to the relevant enforcement authority.",
];

function measuresForTypes(types: string[]): string[] {
  const set = new Set<string>();
  for (const t of types) {
    const key = (t || "").toLowerCase();
    const rule = MEASURES.find((m) => m.match(key));
    (rule ? rule.measures : GENERIC_MEASURES).forEach((m) => set.add(m));
  }
  if (set.size === 0) GENERIC_MEASURES.forEach((m) => set.add(m));
  return [...set];
}

// ~0.01 degrees ≈ 1.1 km. Incidents within the same bucket are treated as the
// same recurring location.
function clusterIncidents(incidents: ReportIncident[]): Cluster[] {
  const buckets = new Map<string, Cluster>();
  for (const inc of incidents) {
    if (typeof inc.latitude !== "number" || typeof inc.longitude !== "number") continue;
    const key = `${inc.latitude.toFixed(2)},${inc.longitude.toFixed(2)}`;
    let c = buckets.get(key);
    if (!c) {
      c = { key, lat: inc.latitude, lng: inc.longitude, incidents: [], typeCounts: {} };
      buckets.set(key, c);
    }
    c.incidents.push(inc);
    c.typeCounts[inc.type] = (c.typeCounts[inc.type] ?? 0) + 1;
  }
  return [...buckets.values()].sort((a, b) => b.incidents.length - a.incidents.length);
}

export type GeneralReport = {
  title: string;
  generatedAt: string;
  totalIncidents: number;
  hotspotCount: number;
  text: string; // plain-text version (for .txt + on-screen preview)
  html: string; // Word-compatible HTML (for .doc download)
};

export function generateGeneralReport(incidents: ReportIncident[]): GeneralReport {
  const now = new Date();
  const generatedAt = now.toLocaleString();
  const total = incidents.length;

  const dates = incidents
    .map((i) => new Date(i.created_at))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const period =
    dates.length > 0
      ? `${dates[0].toLocaleDateString()} – ${dates[dates.length - 1].toLocaleDateString()}`
      : "N/A";

  const typeCounts = incidents.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});
  const typeRank = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const dominant = typeRank[0]?.[0];

  const clusters = clusterIncidents(incidents);
  const recurring = clusters.filter((c) => c.incidents.length >= 2);
  const isolated = clusters.filter((c) => c.incidents.length === 1);

  // ---- Build plain-text report ----
  const L: string[] = [];
  L.push("IUU SURVEILLANCE — GENERAL INTELLIGENCE REPORT");
  L.push("==================================================");
  L.push(`Generated: ${generatedAt}`);
  L.push(`Incidents analyzed: ${total}`);
  L.push(`Reporting period: ${period}`);
  L.push("");

  L.push("1. EXECUTIVE SUMMARY");
  L.push("--------------------");
  if (total === 0) {
    L.push("No incidents have been reported yet. Nothing to analyze.");
  } else {
    L.push(
      `A total of ${total} incident(s) were reported across ${clusters.length} distinct location(s). ` +
        `${recurring.length} location(s) show recurring activity (2+ incidents). ` +
        (dominant ? `The dominant violation type is "${prettyType(dominant)}" (${typeCounts[dominant]} case(s)). ` : "") +
        (recurring[0]
          ? `The highest-risk zone is ${recurring[0].key} with ${recurring[0].incidents.length} recurring incidents.`
          : "No single location shows repeated activity yet."),
    );
  }
  L.push("");

  L.push("2. RECURRING HOTSPOTS (where incidents reoccur)");
  L.push("-----------------------------------------------");
  if (recurring.length === 0) {
    L.push("No location currently has 2 or more incidents. Continue monitoring.");
  } else {
    recurring.forEach((c, idx) => {
      const typesHere = Object.entries(c.typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([t, n]) => `${prettyType(t)} (${n})`)
        .join(", ");
      L.push(`Hotspot #${idx + 1} — Zone ${c.key}  [${c.incidents.length} incidents]`);
      L.push(`   Violation mix: ${typesHere}`);
      L.push(`   Field observations:`);
      c.incidents.slice(0, 6).forEach((i) => {
        const d = new Date(i.created_at).toLocaleDateString();
        const desc = (i.description || "(no description provided)").trim();
        L.push(`     • [${d}] ${prettyType(i.type)}: ${desc}`);
      });
      L.push(`   Recommended measures:`);
      measuresForTypes(Object.keys(c.typeCounts)).forEach((m) => L.push(`     - ${m}`));
      L.push("");
    });
  }

  L.push("3. VIOLATION TYPE BREAKDOWN");
  L.push("---------------------------");
  if (typeRank.length === 0) {
    L.push("No violations recorded.");
  } else {
    typeRank.forEach(([t, n]) => {
      const pct = total > 0 ? Math.round((n / total) * 100) : 0;
      L.push(`   ${prettyType(t)}: ${n} (${pct}%)`);
    });
  }
  L.push("");

  L.push("4. OVERALL RECOMMENDED MEASURES");
  L.push("-------------------------------");
  measuresForTypes(Object.keys(typeCounts)).forEach((m) => L.push(`   - ${m}`));
  L.push("");

  if (isolated.length > 0) {
    L.push("5. ISOLATED INCIDENTS (single occurrence)");
    L.push("-----------------------------------------");
    isolated.slice(0, 20).forEach((c) => {
      const i = c.incidents[0];
      const d = new Date(i.created_at).toLocaleDateString();
      L.push(`   • Zone ${c.key} [${d}] ${prettyType(i.type)} — ${(i.description || "no description").trim()}`);
    });
    L.push("");
  }

  L.push("— End of report. Generated by the IUU Surveillance Command Center.");
  const text = L.join("\n");

  // ---- Build Word-compatible HTML ----
  const esc = (s: string) =>
    (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hotspotHtml = recurring.length
    ? recurring
        .map((c, idx) => {
          const typesHere = Object.entries(c.typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([t, n]) => `${prettyType(t)} (${n})`)
            .join(", ");
          const obs = c.incidents
            .slice(0, 6)
            .map(
              (i) =>
                `<li><strong>${esc(new Date(i.created_at).toLocaleDateString())}</strong> — ${esc(
                  prettyType(i.type),
                )}: ${esc((i.description || "(no description provided)").trim())}</li>`,
            )
            .join("");
          const meas = measuresForTypes(Object.keys(c.typeCounts))
            .map((m) => `<li>${esc(m)}</li>`)
            .join("");
          return `<h3>Hotspot #${idx + 1} — Zone ${esc(c.key)} (${c.incidents.length} incidents)</h3>
            <p><strong>Violation mix:</strong> ${esc(typesHere)}</p>
            <p><strong>Field observations:</strong></p><ul>${obs}</ul>
            <p><strong>Recommended measures:</strong></p><ul>${meas}</ul>`;
        })
        .join("")
    : "<p>No location currently has 2 or more incidents. Continue monitoring.</p>";

  const typeRows = typeRank
    .map(([t, n]) => `<li>${esc(prettyType(t))}: <strong>${n}</strong> (${Math.round((n / Math.max(total, 1)) * 100)}%)</li>`)
    .join("");
  const overallMeasures = measuresForTypes(Object.keys(typeCounts))
    .map((m) => `<li>${esc(m)}</li>`)
    .join("");

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>IUU General Report</title>
<style>
 body{font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1e293b;padding:32px;}
 h1{color:#0f172a;border-bottom:3px solid #14b8a6;padding-bottom:10px;font-size:22pt;}
 h2{color:#0f766e;margin-top:26px;border-bottom:1px solid #cbd5e1;padding-bottom:6px;font-size:15pt;}
 h3{color:#b91c1c;margin-top:18px;font-size:12pt;}
 p,li{font-size:11pt;} .meta{color:#64748b;font-size:10pt;}
</style></head>
<body>
 <h1>IUU Surveillance — General Intelligence Report</h1>
 <p class="meta">Generated: ${esc(generatedAt)} &nbsp;|&nbsp; Incidents analyzed: ${total} &nbsp;|&nbsp; Period: ${esc(period)}</p>
 <h2>1. Executive Summary</h2>
 <p>${
    total === 0
      ? "No incidents have been reported yet."
      : `A total of <strong>${total}</strong> incident(s) were reported across <strong>${clusters.length}</strong> distinct location(s), with <strong>${recurring.length}</strong> recurring hotspot(s). ` +
        (dominant ? `Dominant violation: <strong>${esc(prettyType(dominant))}</strong> (${typeCounts[dominant]} cases). ` : "") +
        (recurring[0] ? `Highest-risk zone: <strong>${esc(recurring[0].key)}</strong> with ${recurring[0].incidents.length} incidents.` : "")
  }</p>
 <h2>2. Recurring Hotspots (where incidents reoccur)</h2>
 ${hotspotHtml}
 <h2>3. Violation Type Breakdown</h2>
 <ul>${typeRows || "<li>No violations recorded.</li>"}</ul>
 <h2>4. Overall Recommended Measures</h2>
 <ul>${overallMeasures}</ul>
 <p class="meta">— Generated by the IUU Surveillance Command Center.</p>
</body></html>`;

  return {
    title: "IUU General Intelligence Report",
    generatedAt,
    totalIncidents: total,
    hotspotCount: recurring.length,
    text,
    html,
  };
}
