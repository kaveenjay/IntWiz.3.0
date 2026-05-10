import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";

function MethodologyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-frame">
      <TopNav />

      <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-14">

        {/* HEADER */}
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — Technical reference
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none mb-4">
          <em className="italic text-accent">Methodology</em>
        </h1>
        <p className="text-ink-soft text-sm sm:text-base mb-14">
          A detailed reference for how each metric is calculated, why these specific approaches were chosen, and known limitations of each measurement.
        </p>

        {/* TABLE OF CONTENTS */}
        <div className="border border-line bg-soft p-6 mb-14">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">
            — Contents
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#overall" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Overall scoring formula</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#relevance" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Relevance</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#technical-depth" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Technical depth</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#star" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>STAR structure</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#fluency" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Fluency</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#pacing" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Pacing</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#pause-quality" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Pause quality</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#vocal-confidence" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Vocal confidence</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#engagement" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>Engagement</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#limitations" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>System-wide limitations</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
            <li>
              <a href="#references" className="group flex items-center justify-between text-ink hover:text-accent transition-colors py-1 border-b border-line/50 hover:border-accent">
                <span>References</span>
                <span className="font-display italic opacity-40 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </li>
          </ul>
        </div>

        {/* OVERALL */}
        <section id="overall" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Overall scoring <em className="italic">formula</em></h2>
            <div className="h-px bg-line-strong" />
          </div>
          <p className="text-ink leading-relaxed mb-4">
            The overall interview score is a weighted average of seven individual metrics, prioritizing content quality and structural clarity over acoustic delivery measures.
          </p>
          <div className="bg-soft border border-line p-5 my-6 font-mono text-xs leading-relaxed overflow-x-auto">
            <div>overall_score = (</div>
            <div className="ml-4">relevance_score        × 0.25 +</div>
            <div className="ml-4">technical_depth_score  × 0.20 +</div>
            <div className="ml-4">star_score             × 0.15 +</div>
            <div className="ml-4">fluency_score          × 0.15 +</div>
            <div className="ml-4">pacing_score           × 0.10 +</div>
            <div className="ml-4">pause_quality_score    × 0.08 +</div>
            <div className="ml-4">confidence_score       × 0.07</div>
            <div>)</div>
          </div>
          <p className="text-ink-soft text-sm leading-relaxed">
            Relevance and technical depth carry the highest weights (45% combined) because they directly measure whether the candidate is discussing relevant content with appropriate expertise. Acoustic measures (pause quality, confidence) carry lower weights due to known limitations in the underlying emotion classifier (see <a href="#limitations" className="text-accent hover:underline">limitations</a>).
          </p>
        </section>

        {/* RELEVANCE */}
        <section id="relevance" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Relevance</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>How closely the candidate's spoken answer aligns with the role's vocabulary and the candidate's CV. Higher scores indicate the candidate is discussing topics directly relevant to the position.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>TF-IDF (Term Frequency-Inverse Document Frequency) cosine similarity between the candidate's transcript and the combined CV + JD context. The raw similarity (typically 0.05–0.40) is then mapped to a 0–100 scale via an empirically-calibrated piecewise function.</p>
            </div>

            <div className="bg-soft border border-line p-4 font-mono text-xs">
              raw_similarity → calibrated_score:<br/>
              0.00–0.05 → 0–10  (off-topic)<br/>
              0.05–0.15 → 10–35 (some overlap)<br/>
              0.15–0.25 → 35–60 (good alignment)<br/>
              0.25–0.35 → 60–85 (strong relevance)<br/>
              0.35–0.45 → 85–95 (very high)<br/>
              0.45+     → 95–100 (exceptional)
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Why TF-IDF over neural embeddings</div>
              <p>Sentence-BERT and similar transformer embeddings would offer better semantic understanding of paraphrasing. TF-IDF was chosen for four reasons specific to this project's goals:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Explainability</strong> — exact term matches can be shown to users, supporting the explainability principle</li>
                <li><strong>Latency</strong> — TF-IDF runs in milliseconds vs 300–800ms for transformer models</li>
                <li><strong>Free-tier deployment</strong> — no GPU server or paid embedding API required</li>
                <li><strong>Determinism</strong> — same input always produces identical output (research reproducibility)</li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Known limitations</div>
              <p>This metric measures vocabulary alignment with the role, not answer quality. A rambling answer with relevant terms scores moderately well. Answer structure is captured separately by STAR analysis.</p>
            </div>
          </div>
        </section>

        {/* TECHNICAL DEPTH */}
        <section id="technical-depth" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Technical <em className="italic">depth</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>Density of domain-specific terminology in the candidate's answer. Higher density signals genuine expertise vs surface-level knowledge.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>Two-pass LLM extraction approach:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Pass 1:</strong> LLM extracts 30–50 expected technical terms from the CV and JD context</li>
                <li><strong>Pass 2:</strong> LLM identifies expert-level terms used in the candidate's transcript (excluding generic terms like "data" or "analysis")</li>
                <li><strong>Weighted matching:</strong> CV/JD-aligned terms count fully (1.0×); transcript-only terms count at 50% (0.5×)</li>
                <li><strong>Density curve:</strong> 1.5% → 25, 3% → 50, 5% → 75, 8%+ → 100</li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Why two-pass extraction</div>
              <p>Single-pass extraction (CV/JD only) misses expert terms the candidate volunteers that weren't anticipated. Two-pass captures both expected expertise and unexpected depth, with weighting that prevents irrelevant jargon from inflating scores.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Domain-agnostic design</div>
              <p>The LLM extraction works for any field — data science, software engineering, marketing, finance — not just technical roles. The "technical" in the name refers to domain-specific vocabulary in any domain.</p>
            </div>
          </div>
        </section>

        {/* STAR STRUCTURE */}
        <section id="star" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">STAR <em className="italic">structure</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>Whether the candidate's answer follows the STAR framework (Situation, Task, Action, Result) — a widely-recommended format for behavioural interview questions.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>LLM-based component detection. Each of the four STAR components is detected independently as boolean (present/absent). The final score is a weighted aggregation:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Situation present: +25 points</li>
                <li>Task implied or stated: +20 points</li>
                <li>Action described: +30 points</li>
                <li>Result quantified or articulated: +25 points</li>
              </ul>
              <p className="mt-2">The Action component carries the highest weight because it is most often missing in weak answers.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Why LLM detection over rule-based</div>
              <p>Rule-based detection (keyword matching like "I implemented" → Action) misses paraphrased components. LLM detection catches semantic equivalents and provides explainable feedback about which components were detected.</p>
            </div>
          </div>
        </section>

        {/* FLUENCY */}
        <section id="fluency" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Fluency</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>How smoothly the candidate speaks. Measured by counting filler words ("um", "uh", "like", "you know", etc.) relative to total word count.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <div className="bg-soft border border-line p-4 font-mono text-xs my-3">
                filler_ratio = filler_count / total_words<br/>
                fluency_score = 100 − (filler_ratio × 1000)<br/>
                clamped to range [0, 100]
              </div>
              <p>Filler words detected: um, uh, like, you know, basically, actually, literally, kinda, sorta, I mean, so, well.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Score interpretation</div>
              <ul className="list-disc ml-6 space-y-1">
                <li>90–100: Polished, professional delivery</li>
                <li>75–89: Mostly fluent with occasional fillers</li>
                <li>60–74: Noticeable hedging</li>
                <li>Below 60: Disrupts comprehension</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PACING */}
        <section id="pacing" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Pacing</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>Whether the candidate's answer length and speech rate are appropriate for an interview context.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>Combined score from two components:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Duration component:</strong> 45–90 seconds is ideal. Too short suggests under-preparation; too long can lose listeners.</li>
                <li><strong>Speech rate component:</strong> 130–160 words per minute is optimal. Too slow feels rehearsed, too fast feels rushed.</li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Research basis</div>
              <p>Based on Barrick et al. (2009) research showing interviewer ratings correlate with answer length around the 60-second mark, with diminishing returns thereafter.</p>
            </div>
          </div>
        </section>

        {/* PAUSE QUALITY */}
        <section id="pause-quality" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Pause <em className="italic">quality</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>How effectively the candidate uses silence in delivery. Strategic 1–2 second pauses between thoughts signal composure; rushing through without pauses or hesitating excessively both signal lack of preparation.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation methodology</div>
              <ol className="list-decimal ml-6 mt-2 space-y-2">
                <li><strong>Trim leading/trailing silence</strong> using librosa.effects.trim() — pre-answer thinking pauses are not part of delivery</li>
                <li><strong>Detect non-silent intervals</strong> using top_db=25 (stricter threshold to exclude micro-gaps between words)</li>
                <li><strong>Filter pauses below 500ms</strong> — these are speech rhythm, not meaningful thought pauses</li>
                <li><strong>Score against Goldman-Eisler thresholds:</strong></li>
              </ol>
              <div className="bg-soft border border-line p-4 font-mono text-xs my-3">
                Rate-primary scoring:<br/>
                Ideal rate (3–7/min):       base 85<br/>
                Acceptable rate (2–10/min): base 65<br/>
                Rushing (&lt;2/min):         base 50<br/>
                Hesitating (&gt;10/min):     base 40<br/>
                <br/>
                Duration modifier:<br/>
                Ideal duration (0.7–2.0s):  +10<br/>
                Acceptable (0.5–3.0s):      +5<br/>
                <br/>
                Final = base + modifier (capped at 95)
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Research basis</div>
              <p>Adapted from Goldman-Eisler (1968) research on professional speech patterns. Original thresholds (3–5 pauses/min) widened for conversational interview Q&A vs the more formal monologue corpus Goldman-Eisler studied.</p>
            </div>
          </div>
        </section>

        {/* VOCAL CONFIDENCE */}
        <section id="vocal-confidence" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Vocal <em className="italic">confidence</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>Acoustic indicator of confidence from voice characteristics — pitch stability, energy levels, tone variation.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>TensorFlow MLP emotion classifier trained on 12,000+ samples from RAVDESS, TESS, CREMA-D, and SAVEE corpora. The model produces probability distributions across 7 emotions; vocal confidence is derived from low fear/sad probabilities and high neutral/happy probabilities.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Important limitation</div>
              <p>The training corpora consist of <strong>theatrical/exaggerated speech</strong> (acted emotions for film/research). Professional interview speech is naturally more controlled. This domain mismatch means the model may underestimate confidence in well-delivered, calm interview answers — labeling them as "fear" or "sad" when they're simply professionally composed.</p>
              <p className="mt-2">This metric is shown for transparency but weighted at only 7% in the overall score precisely because of this limitation.</p>
            </div>
          </div>
        </section>

        {/* ENGAGEMENT */}
        <section id="engagement" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Engagement</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— What it measures</div>
              <p>Acoustic measure of vocal energy and animation in delivery. Reflects how dynamic versus monotone the candidate's speech sounds.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Calculation</div>
              <p>Derived from the same emotion classifier used for vocal confidence, weighted toward "happy" and "surprise" probabilities, inverse to "neutral" and "sad". Higher dynamism scores higher.</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">— Same limitation as vocal confidence</div>
              <p>Calm, professional delivery may register as "low engagement" even when the candidate is clearly invested in their answer.</p>
            </div>
          </div>
        </section>

        {/* SYSTEM-WIDE LIMITATIONS */}
        <section id="limitations" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">System-wide <em className="italic">limitations</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink leading-relaxed">
            <p><strong>Acoustic emotion model domain mismatch.</strong> The acoustic emotion classifier was trained on theatrical speech corpora (RAVDESS, TESS, CREMA-D, SAVEE) where emotions are deliberately exaggerated by actors. Professional interview speech is naturally more controlled, which may cause the model to underestimate emotional engagement and confidence in well-delivered answers. We acknowledge this transparently and weight acoustic measures lightly (15% combined) in the overall score.</p>

            <p><strong>Transcription dependence.</strong> Most metrics depend on accurate transcription via Whisper. Heavy accents, background noise, or poor microphone quality may produce transcription errors that cascade into lower scores across multiple metrics. The system is most accurate with clear English audio in quiet environments.</p>

            <p><strong>Cultural and individual variation.</strong> The pacing and pause quality thresholds derive from research on Western, English-speaking, professional contexts. Candidates from different cultural backgrounds may have natural speech patterns that differ from these benchmarks without indicating poor delivery.</p>

            <p><strong>STAR framework bias.</strong> The STAR structure metric privileges a specific answer format. Equally valid answers using other structures (PAR, CAR, situation-only descriptions) may score lower despite communicating effectively.</p>
          </div>
        </section>

        {/* REFERENCES */}
        <section id="references" className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">References</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-3 text-sm text-ink-soft leading-relaxed">
            <p>Goldman-Eisler, F. (1968). <em>Psycholinguistics: Experiments in Spontaneous Speech.</em> Academic Press.</p>
            <p>Barrick, M. R., Shaffer, J. A., & DeGrassi, S. W. (2009). What you see may not be what you get: Relationships among self-presentation tactics and ratings of interview and job performance. <em>Journal of Applied Psychology</em>, 94(6), 1394–1411.</p>
            <p>Maurer, T. J., & Fay, C. (1988). Effect of situational interviews, conventional structured interviews, and training on interview rating agreement: An experimental analysis. <em>Personnel Psychology</em>, 41(2), 329–344.</p>
            <p>Livingstone, S. R., & Russo, F. A. (2018). The Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS). <em>PLOS ONE</em>, 13(5).</p>
            <p>Cao, H., Cooper, D. G., Keutmann, M. K., Gur, R. C., Nenkova, A., & Verma, R. (2014). CREMA-D: Crowd-sourced emotional multimodal actors dataset. <em>IEEE Transactions on Affective Computing</em>, 5(4), 377–390.</p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-20 mb-8 space-y-4">
          <p className="text-ink-soft">Have feedback or questions?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/help"
              className="border border-line-strong px-6 sm:px-10 py-4 sm:py-5 font-mono text-xs sm:text-sm uppercase tracking-widest text-ink hover:bg-soft transition-colors"
            >
              Back to Help
            </Link>
            <button
              onClick={() => navigate("/interview/setup")}
              className="bg-ink text-page px-6 sm:px-10 py-4 sm:py-5 font-mono text-xs sm:text-sm uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Start Interview →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MethodologyPage;
