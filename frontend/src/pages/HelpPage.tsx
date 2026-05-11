import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";

function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-frame">
      <TopNav />

      <main id="main-content" className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-14">

        {/* HEADER */}
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          <span aria-hidden="true">— </span>Reference
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none mb-4">
          <em className="italic text-accent">Help</em> & guide
        </h1>
        <p className="text-ink-soft text-sm sm:text-base mb-10 sm:mb-14">
          Everything you need to make the most of IntWiz.
        </p>

        {/* SECTION: WHAT IS INTWIZ */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">What is <em className="italic">IntWiz</em>?</h2>
            <div className="h-px bg-line-strong" />
          </div>
          <p className="text-ink leading-relaxed mb-4">
            IntWiz is an AI-powered interview preparation platform that simulates
            realistic technical and behavioural interviews. It listens to your spoken
            answers and provides detailed feedback across 17 metrics spanning your
            content quality, delivery patterns, and structural clarity.
          </p>
          <p className="text-ink leading-relaxed">
            Unlike generic interview prep tools, IntWiz adapts each question to your
            CV, the job description you're targeting, and your performance in earlier
            answers. Every score is fully explainable — you can see exactly which
            keywords matched, which structural components were detected, and how each
            metric was calculated.
          </p>
        </section>

        {/* SECTION: HOW TO USE */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Getting <em className="italic">started</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
              <div className="font-display text-3xl italic text-accent leading-none w-8">i</div>
              <div>
                <h3 className="font-display text-xl mb-2">Upload your CV</h3>
                <p className="text-ink-soft leading-relaxed">
                  On the setup page, upload a PDF version of your CV. The AI uses
                  this to ask questions tailored to your background and experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
              <div className="font-display text-3xl italic text-accent leading-none w-8">ii</div>
              <div>
                <h3 className="font-display text-xl mb-2">Add the job description</h3>
                <p className="text-ink-soft leading-relaxed">
                  Either paste the job description text or upload a PDF. The interviewer
                  references this to ensure questions align with the role you're targeting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
              <div className="font-display text-3xl italic text-accent leading-none w-8">iii</div>
              <div>
                <h3 className="font-display text-xl mb-2">Choose your mode</h3>
                <p className="text-ink-soft leading-relaxed">
                  Adaptive mode (recommended) lets the AI decide the length and
                  difficulty based on your answers. Fixed mode lets you pre-set the
                  number of questions for time-boxed practice.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
              <div className="font-display text-3xl italic text-accent leading-none w-8">iv</div>
              <div>
                <h3 className="font-display text-xl mb-2">Record your answers</h3>
                <p className="text-ink-soft leading-relaxed">
                  Click "Start Recording" when ready, speak naturally, then click
                  "Stop & Analyze" when done. The AI transcribes, analyzes, and
                  prepares the next question.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
              <div className="font-display text-3xl italic text-accent leading-none w-8">v</div>
              <div>
                <h3 className="font-display text-xl mb-2">Review your results</h3>
                <p className="text-ink-soft leading-relaxed">
                  After the interview, you'll see your overall score, AI-generated
                  summary, and detailed per-question breakdowns. Download a PDF
                  for offline review or revisit anytime from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: UNDERSTANDING SCORES */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">
              Understanding your <em className="italic">scores</em>
            </h2>
            <div className="h-px bg-line-strong" />
          </div>
          <p className="text-ink-soft mb-8">
            Each interview is scored across six dimensions. Here's what each one measures:
          </p>

          <div className="space-y-6">
            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">Relevance</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                How closely your answer aligns with the job description and your CV.
                Calculated using TF-IDF cosine similarity between your transcript and
                the role context. Higher scores mean you're discussing topics directly
                relevant to the role.
              </p>
            </div>

            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">Technical depth</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Density of domain-specific terminology in your answer. The AI extracts
                relevant technical vocabulary from your CV and the JD, plus identifies
                expert terms in your speech, then measures how often you use them.
                Higher density signals genuine expertise vs surface-level knowledge.
              </p>
            </div>

            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">STAR structure</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Whether your answer follows the STAR framework (Situation, Task,
                Action, Result) — a widely-recommended structure for behavioural
                interview questions. Higher scores mean you're providing context,
                describing actions, and explaining outcomes.
              </p>
            </div>

            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">Fluency</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                How smoothly you speak. Measured by counting filler words
                ("um", "uh", "like", etc.) relative to your total word count.
                Fewer fillers = higher fluency. Speaking naturally without
                excessive hedging signals confidence and preparation.
              </p>
            </div>

            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">Pacing</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Whether your answer length and speed are appropriate. Ideal interview
                answers run 45–90 seconds. Too short suggests under-preparation; too
                long can lose the listener. Words-per-minute also factors in — too
                slow feels rehearsed, too fast feels rushed.
              </p>
            </div>

            <div className="border-l-2 border-accent pl-6 py-2">
              <h3 className="font-display text-xl mb-2">Pause quality</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                How you use silence in your delivery. Strategic 1–2 second pauses
                between thoughts demonstrate composure. Excessive long pauses signal
                hesitation; speaking continuously without pauses suggests rushing.
                Based on Goldman-Eisler's research on professional speech patterns.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-soft border-l-2 border-line-strong">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              — Note on acoustic analysis
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              The acoustic emotion classifier was trained on theatrical speech
              corpora and may underestimate engagement in professionally controlled
              interview speech. This is a known limitation documented in the system
              and reflects a broader research finding about domain mismatches in
              affective computing.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-sm text-ink-soft">
              Want to dig deeper into how each score is calculated?{" "}
              <Link to="/methodology" className="text-accent border-b border-accent">
                Read the technical methodology →
              </Link>
            </p>
          </div>
        </section>

        {/* SECTION: FAQ */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">
              Frequently asked <em className="italic">questions</em>
            </h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl mb-2">Why was my answer scored low?</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Each metric is fully explainable. On the results page, expand any
                question card to see exactly which terms matched, which structural
                components were detected, and your speech statistics. Low scores
                often reflect specific gaps you can target in practice.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl mb-2">Is my audio stored?</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Only if you explicitly opt in via the "Save audio recordings" toggle
                on the setup page. When enabled, recordings are stored on Firebase
                Storage with automatic deletion after 30 days. When disabled, audio
                is processed and discarded immediately.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl mb-2">
                How does adaptive mode decide when to stop?
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Adaptive mode terminates the interview when one of three conditions
                is met: (1) you've answered 8–10 questions covering distinct
                competencies, (2) you've shown consistent difficulty across multiple
                consecutive answers, or (3) you've demonstrated mastery and further
                questioning would be redundant.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl mb-2">Can I retake a question?</h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                Not within the same session. Just like a real interview, each
                response is committed once submitted. To practice the same type of
                question again, start a new interview with similar setup parameters.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl mb-2">
                What happens if my microphone fails?
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                IntWiz will display a clear error message if it can't access your
                microphone. You can grant permissions through your browser settings
                and retry. If the recording fails mid-answer, simply start over —
                no partial data is saved.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl mb-2">
                Why does the dominant emotion sometimes seem wrong?
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">
                The acoustic emotion model was trained on theatrical performances,
                where emotions are deliberately exaggerated. Professional interview
                speech is naturally more controlled, which the model may interpret
                differently. We display this metric for transparency but weight it
                lightly in the overall scoring.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: PRIVACY & DATA */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Privacy & <em className="italic">data</em></h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="space-y-4 text-ink-soft text-sm leading-relaxed">
            <p>
              <strong className="text-ink">What we store:</strong> Your email
              (for authentication), your interview reports (for history and
              tracking progress), and optionally your audio recordings if you
              opt in.
            </p>
            <p>
              <strong className="text-ink">What we don't store:</strong> Your
              raw CV text and job description text are used during analysis
              and stored alongside reports for context, but are not shared with
              third parties or used for any purpose beyond your own review.
            </p>
            <p>
              <strong className="text-ink">Audio storage:</strong> Off by default.
              When enabled, recordings auto-delete after 30 days. You can change
              this preference at any time in Settings.
            </p>
            <p>
              <strong className="text-ink">Third-party services:</strong> IntWiz
              uses Firebase (Google Cloud) for authentication and storage, and
              Groq for transcription and language model inference. Your data is
              transmitted securely (HTTPS) and processed under their respective
              privacy policies.
            </p>
            <p>
              <strong className="text-ink">Your control:</strong> You can review
              your saved data anytime from Profile and Settings pages.
            </p>
          </div>
        </section>

        {/* SECTION: CONTACT */}
        <section className="mb-16">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl">Contact</h2>
            <div className="h-px bg-line-strong" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Project author
              </div>
              <div className="font-display text-xl">Kaveen Jayamanne</div>
              <div className="text-ink-soft text-sm mt-1">
                BSc Data Science, University of Plymouth
              </div>
            </div>

            <div className="bg-frame p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
                Repository
              </div>
              <div className="font-display text-xl">GitHub</div>
              <div className="text-ink-soft text-sm mt-1">
                Source code available for review
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-20 mb-8">
          <p className="text-ink-soft mb-6">Ready to start practicing?</p>
          <button
            onClick={() => navigate("/interview/setup")}
            className="bg-ink text-page px-6 sm:px-10 py-4 sm:py-5 font-mono text-sm sm:text-base uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-3 mx-auto"
          >
            Start New Interview
            <span className="font-display italic text-2xl">→</span>
          </button>
        </div>

      </main>
    </div>
  );
}

export default HelpPage;
