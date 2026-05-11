import { jsPDF } from "jspdf";
import type { FullReport, QuestionResult } from "../services/api";

// ===== Page layout =====

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 170mm

// ===== Brand colors =====

const COLORS = {
  ink:     { r: 26,  g: 24,  b: 20  }, // #1A1814
  inkSoft: { r: 102, g: 102, b: 102 },
  inkFaint:{ r: 153, g: 153, b: 153 },
  accent:  { r: 45,  g: 74,  b: 62  }, // #2D4A3E
  page:    { r: 244, g: 241, b: 234 }, // #F4F1EA
  line:    { r: 220, g: 215, b: 200 },
  warn:    { r: 184, g: 85,  b: 61  }, // #B8553D
  success: { r: 74,  g: 124, b: 89  }, // #4A7C59
};

// ===== Low-level helpers =====

function setColor(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setTextColor(color.r, color.g, color.b);
}

function setFill(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setFillColor(color.r, color.g, color.b);
}

function setDraw(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setDrawColor(color.r, color.g, color.b);
}

function ensureSpace(doc: jsPDF, currentY: number, neededSpace: number): number {
  if (currentY + neededSpace > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return currentY;
}

// ===== Domain helpers =====

function getScoreTagline(score: number): string {
  if (score >= 85) return "Excellent performance";
  if (score >= 75) return "Strong performance";
  if (score >= 65) return "Solid foundation";
  if (score >= 50) return "Good start, room to grow";
  return "Plenty to work on";
}

function toRoman(num: number): string {
  const numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];
  return numerals[num - 1] || num.toString();
}

function calculateQuestionScore(q: QuestionResult): number {
  return Math.round(
    q.relevance_score       * 0.25 +
    q.technical_depth_score * 0.20 +
    q.star_analysis.star_score * 0.15 +
    q.fluency_score         * 0.15 +
    q.pacing_score          * 0.10 +
    q.pause_quality_score   * 0.08 +
    q.confidence_score      * 0.07
  );
}

function dateString(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

// ===== Section renderers =====

function drawHeader(doc: jsPDF, report: FullReport): number {
  // "Int" in ink, "Wiz" in accent — mimics web app wordmark
  doc.setFont("times", "italic");
  doc.setFontSize(28);
  setColor(doc, COLORS.ink);
  doc.text("Int", MARGIN_LEFT, MARGIN_TOP + 5);

  doc.setFont("times", "italic");
  doc.setFontSize(28);
  setColor(doc, COLORS.accent);
  doc.text("Wiz", MARGIN_LEFT + 18, MARGIN_TOP + 5);

  // Subtitle eyebrow
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("INTERVIEW PERFORMANCE REPORT", MARGIN_LEFT, MARGIN_TOP + 12);

  // Date (right-aligned)
  const dateStr = new Date(report.timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  setColor(doc, COLORS.inkSoft);
  doc.text(dateStr, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 8, { align: "right" });

  // Underline
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 18, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 18);

  return MARGIN_TOP + 24;
}

function drawSummary(doc: jsPDF, report: FullReport, _startY: number): number {
  // Fixed y position so big number never collides with header
  let y = 60;

  // Eyebrow
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  setColor(doc, COLORS.inkSoft);
  doc.text("— OVERALL SCORE", MARGIN_LEFT, y);
  y += 14; // generous gap before big number

  // Big score
  doc.setFont("times", "italic");
  doc.setFontSize(48);
  setColor(doc, COLORS.accent);
  doc.text(String(Math.round(report.overall_score)), MARGIN_LEFT, y);

  // Tagline on its own line below
  y += 8;
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  setColor(doc, COLORS.ink);
  doc.text(getScoreTagline(report.overall_score), MARGIN_LEFT, y);
  y += 15;

  // AI summary box — left accent border, justified text
  y += 5;
  const summaryWidth = CONTENT_WIDTH - 10;
  const summaryLines = doc.splitTextToSize(report.ai_summary, summaryWidth);
  const boxHeight = Math.max(50, summaryLines.length * 5 + 20);

  setDraw(doc, COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT, y + boxHeight);

  // Eyebrow inside box
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.accent);
  doc.text("— AI-GENERATED SUMMARY", MARGIN_LEFT + 5, y + 8);

  // Justified summary text — pass raw string so jsPDF can justify properly
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  setColor(doc, COLORS.ink);
  doc.text(report.ai_summary, MARGIN_LEFT + 5, y + 18, {
    align: "justify",
    maxWidth: summaryWidth,
  });

  y += boxHeight + 10;
  return y;
}

function drawBreakdown(doc: jsPDF, report: FullReport, startY: number): number {
  let y = ensureSpace(doc, startY, 80);

  doc.setFont("times", "italic");
  doc.setFontSize(20);
  setColor(doc, COLORS.ink);
  doc.text("Performance breakdown", MARGIN_LEFT, y);
  y += 12;

  const metrics: { label: string; value: number }[] = [
    { label: "Relevance",       value: Math.round(report.average_relevance) },
    { label: "Technical depth", value: Math.round(report.average_technical_depth) },
    { label: "STAR structure",  value: Math.round(report.average_star) },
    { label: "Fluency",         value: Math.round(report.average_fluency) },
    { label: "Pacing",          value: Math.round(report.average_pacing) },
    { label: "Pause quality",   value: Math.round(report.average_pause_quality) },
  ];

  const barX = MARGIN_LEFT + 50;
  const barWidth = 100;
  const barHeight = 3;

  for (const metric of metrics) {
    y = ensureSpace(doc, y, 10);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setColor(doc, COLORS.ink);
    doc.text(metric.label, MARGIN_LEFT, y);

    // Track
    setFill(doc, COLORS.line);
    setDraw(doc, COLORS.line);
    doc.rect(barX, y - barHeight, barWidth, barHeight, "F");

    // Fill
    setFill(doc, COLORS.accent);
    doc.rect(barX, y - barHeight, (metric.value / 100) * barWidth, barHeight, "F");

    // Score
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    setColor(doc, COLORS.ink);
    doc.text(String(metric.value), MARGIN_LEFT + 160, y, { align: "right" });

    y += 8;
  }

  y += 8;
  return y;
}

function drawQuickStats(doc: jsPDF, report: FullReport, startY: number): number {
  let y = ensureSpace(doc, startY, 30);

  const stats: [string, string][] = [
    ["Questions",    String(report.question_count).padStart(2, "0")],
    ["Mode",         report.mode === "adaptive" ? "Adaptive" : "Fixed"],
    ["Filler words", String(report.total_filler_words)],
  ];

  const boxW = (CONTENT_WIDTH - 8) / 3;
  const boxH = 22;

  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.3);

  stats.forEach(([label, value], i) => {
    const x = MARGIN_LEFT + i * (boxW + 4);
    setFill(doc, COLORS.page);
    doc.rect(x, y, boxW, boxH, "FD");

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    setColor(doc, COLORS.inkSoft);
    doc.text(label.toUpperCase(), x + 4, y + 7);

    doc.setFont("times", "italic");
    doc.setFontSize(18);
    setColor(doc, COLORS.ink);
    doc.text(value, x + 4, y + 18);
  });

  y += boxH + 14;
  return y;
}

function drawQuestionCard(doc: jsPDF, q: QuestionResult, idx: number, startY: number): number {
  let y = ensureSpace(doc, startY, 50);
  const score = calculateQuestionScore(q);
  const textWidth = CONTENT_WIDTH - 10;

  const textWidthInCard = CONTENT_WIDTH - 14;

  // Pre-calculate question text height so the entire card-top is drawn in one rect
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  const questionLines = doc.splitTextToSize(q.question, textWidthInCard);
  const questionTextHeight = questionLines.length * 5;
  const cardTopHeight = 14 + questionTextHeight;

  y = ensureSpace(doc, y, cardTopHeight + 8);

  // Card-top background
  setFill(doc, COLORS.page);
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, cardTopHeight, "FD");

  // Accent left rule (full height of card-top)
  setFill(doc, COLORS.accent);
  doc.rect(MARGIN_LEFT, y, 1.5, cardTopHeight, "F");

  // Roman numeral inside card-top
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  setColor(doc, COLORS.accent);
  doc.text(toRoman(idx + 1), MARGIN_LEFT + 6, y + 8);

  // Score on right
  doc.setFont("courier", "normal");
  doc.setFontSize(13);
  setColor(doc, COLORS.accent);
  doc.text(String(score), PAGE_WIDTH - MARGIN_RIGHT - 4, y + 8, { align: "right" });

  // Question text inside card-top, below numeral/score row
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  setColor(doc, COLORS.ink);
  doc.text(questionLines, MARGIN_LEFT + 6, y + 14);

  y += cardTopHeight + 5;

  // ── Transcript ──
  y = ensureSpace(doc, y, 14);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("— TRANSCRIPT", MARGIN_LEFT + 5, y);
  y += 5;

  const transcriptText = `"${q.transcript}"`;
  const transcriptLines = doc.splitTextToSize(transcriptText, textWidth);
  const visibleLineCount = Math.min(transcriptLines.length, 10);

  y = ensureSpace(doc, y, visibleLineCount * 4 + 5);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  setColor(doc, COLORS.ink);

  if (transcriptLines.length <= 10) {
    doc.text(transcriptText, MARGIN_LEFT + 5, y, { align: "justify", maxWidth: textWidth });
  } else {
    const truncated = transcriptLines.slice(0, 10).join(" ") + "...";
    doc.text(truncated, MARGIN_LEFT + 5, y, { align: "justify", maxWidth: textWidth });
  }

  y += visibleLineCount * 4 + 8;

  // ── Detailed metrics (two-column) ──
  y = ensureSpace(doc, y, 30);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("— DETAILED METRICS", MARGIN_LEFT + 5, y);
  y += 5;

  const half = CONTENT_WIDTH / 2 - 4;
  const metricPairs: [string, number][] = [
    ["Relevance",        q.relevance_score],
    ["Technical depth",  q.technical_depth_score],
    ["STAR structure",   q.star_analysis.star_score],
    ["Fluency",          q.fluency_score],
    ["Pacing",           q.pacing_score],
    ["Pause quality",    q.pause_quality_score],
    ["Vocal confidence", q.confidence_score],
    ["Engagement",       q.engagement_score],
  ];

  for (let i = 0; i < metricPairs.length; i += 2) {
    y = ensureSpace(doc, y, 7);
    drawMetricRow(doc, metricPairs[i][0], metricPairs[i][1], MARGIN_LEFT + 5, y, half - 5);
    if (metricPairs[i + 1]) {
      drawMetricRow(doc, metricPairs[i + 1][0], metricPairs[i + 1][1], MARGIN_LEFT + half + 8, y, half - 5);
    }
    y += 7;
  }

  y += 2;

  // ── Speech stats ──
  y = ensureSpace(doc, y, 20);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("— SPEECH STATS", MARGIN_LEFT + 5, y);
  y += 5;

  const statBoxW = (CONTENT_WIDTH - 6) / 4;
  const speechStats: [string, string][] = [
    ["Duration",     `${Math.round(q.duration_seconds)}s`],
    ["Words/min",    String(Math.round(q.wpm))],
    ["Filler words", String(q.filler_word_count)],
    ["Tone",         String(q.detected_tone)],
  ];

  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  speechStats.forEach(([label, val], i) => {
    const sx = MARGIN_LEFT + i * (statBoxW + 2);
    setFill(doc, COLORS.page);
    doc.rect(sx, y, statBoxW, 13, "FD");

    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    setColor(doc, COLORS.inkSoft);
    doc.text(label.toUpperCase(), sx + 2, y + 5);

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setColor(doc, COLORS.ink);
    doc.text(val, sx + 2, y + 11);
  });
  y += 17;

  // ── STAR analysis ──
  y = ensureSpace(doc, y, 28);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("— STAR STRUCTURE", MARGIN_LEFT + 5, y);
  y += 5;

  const starComponents: [string, boolean][] = [
    ["Situation", q.star_analysis.has_situation],
    ["Action",    q.star_analysis.has_action],
    ["Result",    q.star_analysis.has_result],
  ];

  const starBoxW = (CONTENT_WIDTH - 4) / 3;
  starComponents.forEach(([label, present], i) => {
    const sx = MARGIN_LEFT + i * (starBoxW + 2);
    setFill(doc, present ? { r: 232, g: 240, b: 236 } : COLORS.page);
    setDraw(doc, present ? COLORS.success : COLORS.line);
    doc.setLineWidth(0.3);
    doc.rect(sx, y, starBoxW, 11, "FD");

    setColor(doc, present ? COLORS.success : COLORS.inkFaint);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${present ? "[X]" : "[ ]"}  ${label}`, sx + 3, y + 7);
  });
  y += 15;

  // ── AI feedback ──
  y = ensureSpace(doc, y, 14);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.inkSoft);
  doc.text("— AI FEEDBACK", MARGIN_LEFT + 5, y);
  y += 5;

  const feedbackText = q.star_analysis.star_feedback;
  const feedbackLines = doc.splitTextToSize(feedbackText, textWidth);
  const visibleFeedbackCount = Math.min(feedbackLines.length, 5);

  y = ensureSpace(doc, y, visibleFeedbackCount * 4 + 5);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  setColor(doc, COLORS.ink);

  if (feedbackLines.length <= 5) {
    doc.text(feedbackText, MARGIN_LEFT + 5, y, { align: "justify", maxWidth: textWidth });
  } else {
    const truncated = feedbackLines.slice(0, 5).join(" ") + "...";
    doc.text(truncated, MARGIN_LEFT + 5, y, { align: "justify", maxWidth: textWidth });
  }

  y += visibleFeedbackCount * 4 + 10;

  // Divider between cards
  y = ensureSpace(doc, y, 4);
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 8;

  return y;
}

function drawMetricRow(
  doc: jsPDF,
  label: string,
  value: number,
  x: number,
  y: number,
  totalWidth: number
): void {
  const LABEL_W = 38;
  const SCORE_W = 10;
  const barWidth = totalWidth - LABEL_W - SCORE_W - 4;
  const barX = x + LABEL_W;
  const BAR_H = 2.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.ink);
  doc.text(label, x, y);

  setFill(doc, COLORS.line);
  doc.rect(barX, y - BAR_H, barWidth, BAR_H, "F");

  setFill(doc, COLORS.accent);
  doc.rect(barX, y - BAR_H, (barWidth * value) / 100, BAR_H, "F");

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.accent);
  doc.text(String(Math.round(value)), x + totalWidth, y, { align: "right" });
}

function addPageNumbers(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    setColor(doc, COLORS.inkFaint);
    doc.text(
      `Generated by IntWiz · Page ${i} of ${total}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: "center" }
    );
  }
}

// ===== Main export =====

export default function generateReportPDF(report: FullReport): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = drawHeader(doc, report);
  y = drawSummary(doc, report, y);
  y = drawBreakdown(doc, report, y);
  y = drawQuickStats(doc, report, y);

  // Per-question heading
  y = ensureSpace(doc, y, 16);
  doc.setFont("times", "italic");
  doc.setFontSize(20);
  setColor(doc, COLORS.ink);
  doc.text("Per-question breakdown", MARGIN_LEFT, y);
  y += 12;

  for (let i = 0; i < report.interview_results.length; i++) {
    y = drawQuestionCard(doc, report.interview_results[i], i, y);
  }

  addPageNumbers(doc);

  doc.save(`intwiz_report_${dateString(report.timestamp)}.pdf`);
}
