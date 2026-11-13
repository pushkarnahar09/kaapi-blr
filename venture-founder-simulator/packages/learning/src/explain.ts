/**
 * "Explain this" with the player's own numbers (doc 14, section 1.1). Deterministic text,
 * built only from values passed in; nothing here invents a figure.
 */

export interface ScoreContext {
  readonly industryName: string;
  readonly base: number;
  readonly low: number;
  readonly high: number;
  readonly evidenceCoverage: number;
  /** Criteria with the biggest weight × score contribution, highest first. */
  readonly drivers: readonly { readonly name: string; readonly score: number; readonly weight: number }[];
  readonly knockouts: readonly string[];
}

export function explainScore(c: ScoreContext): string[] {
  const lines = [
    `${c.industryName} scores ${Math.round(c.base)} out of 100 on your weights, with a range of ${Math.round(c.low)} to ${Math.round(c.high)}.`,
  ];
  const spread = c.high - c.low;
  lines.push(
    spread > 40
      ? "The range is wide, so the score says little yet. Fieldwork would narrow it."
      : spread > 20
        ? "The range is moderate. A few assumptions still decide where the truth sits."
        : "The range is narrow, so the score is fairly settled on current evidence.",
  );
  const cov = Math.round(c.evidenceCoverage * 100);
  lines.push(
    cov < 50
      ? `Only ${cov}% of the weight rests on firm evidence. Treat the score as a hypothesis.`
      : `${cov}% of the weight rests on firm evidence.`,
  );
  if (c.drivers.length) {
    lines.push(`It is driven most by ${c.drivers.slice(0, 3).map((d) => `${d.name.toLowerCase()} (${d.score.toFixed(1)} of 5, weight ${d.weight})`).join(", ")}.`);
  }
  if (c.knockouts.length) lines.push(`Red flags to resolve whatever the score: ${c.knockouts.join(" ")}`);
  return lines;
}

export interface CapitalContext {
  readonly bandLabel: string;
  readonly maxExposure: number;
}

export function explainCapital(c: CapitalContext): string {
  return `This business plausibly needs ${c.bandLabel} for a first unit, against the ₹${c.maxExposure.toLocaleString("en-IN")} you said you could lose. The band is a model assumption; quotations replace it.`;
}
