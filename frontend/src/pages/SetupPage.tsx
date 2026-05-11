import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestions, getPreferences } from "../services/api";
import TopNav from "../components/TopNav";
import { useAuth } from "../contexts/AuthContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function SetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jdInputType,     setJdInputType]     = useState<"pdf" | "text">("text");
  const [jdText,          setJdText]          = useState("");
  const [mode,            setMode]            = useState<"adaptive" | "fixed">("adaptive");
  const [targetQuestions, setTargetQuestions] = useState(7);
  const [saveAudio,       setSaveAudio]       = useState(false);

  const [cvFile,       setCvFile]       = useState<File | null>(null);
  const [jdFile,       setJdFile]       = useState<File | null>(null);
  const [dragActive,   setDragActive]   = useState<"cv" | "jd" | null>(null);
  const [uploadError,  setUploadError]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const cvInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const loadPrefs = async () => {
      try {
        const response = await getPreferences(user.uid);
        const prefs = response.preferences;
        setMode(prefs.defaultMode);
        setTargetQuestions(prefs.defaultTargetQuestions);
        setSaveAudio(prefs.defaultSaveAudio);
      } catch (err) {
        // Preferences failing to load is non-critical — keep the form defaults
        console.error("Failed to load preferences:", err);
      }
    };

    loadPrefs();
  }, [user?.uid]);

  // ── File validation ────────────────────────────────────────────────────────

  const validateAndSetFile = (file: File, type: "cv" | "jd") => {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File must be smaller than 10MB.");
      return;
    }
    setUploadError("");
    if (type === "cv") setCvFile(file);
    else               setJdFile(file);
  };

  // ── CV handlers ────────────────────────────────────────────────────────────

  const handleCvClick = () => cvInputRef.current?.click();

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file, "cv");
    // Reset the input so the same file can be re-selected after clearing
    e.target.value = "";
  };

  const handleCvDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive("cv");
  };

  const handleCvDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(null);
  };

  const handleCvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(null);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file, "cv");
  };

  // ── JD handlers ────────────────────────────────────────────────────────────

  const handleJdClick = () => jdInputRef.current?.click();

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file, "jd");
    e.target.value = "";
  };

  const handleJdDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive("jd");
  };

  const handleJdDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(null);
  };

  const handleJdDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(null);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file, "jd");
  };

  // ── Misc helpers ───────────────────────────────────────────────────────────

  const pillClass = (n: number) =>
    mode === "fixed" && targetQuestions === n
      ? "w-10 h-10 flex items-center justify-center bg-ink text-page font-mono text-sm cursor-pointer"
      : "w-10 h-10 flex items-center justify-center border border-line-strong font-mono text-sm text-ink-soft cursor-pointer";

  const handlePillClick = (n: number) => {
    setTargetQuestions(n);
    setMode("fixed");
  };

  const isFormValid = cvFile !== null && (jdText.length > 0 || jdFile !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const interviewId = crypto.randomUUID();
      const response = await generateQuestions(cvFile!, jdText, jdFile, 1);

      sessionStorage.setItem("intwiz_interview", JSON.stringify({
        interviewId,
        cvText:          response.cv_text,
        jdText:          response.jd_text,
        mode,
        targetQuestions,
        saveAudio,
        firstQuestion:   response.questions[0],
        startedAt:       new Date().toISOString(),
      }));

      navigate("/interview/active");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setSubmitError("There was a problem with your CV or job description. Please check the files.");
      } else if (status === 500) {
        setSubmitError("Server error. Please try again in a moment.");
      } else if (err?.message?.includes("Network")) {
        setSubmitError("Network error. Please check your connection and that the backend is running.");
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-frame">

      <TopNav />

      {/* MAIN CONTENT */}
      <main id="main-content" className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-16">

        {/* HEADER */}
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — New session
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none mb-4">
          Set up your <em className="italic text-accent">interview</em>
        </h1>
        <p className="text-ink-soft mb-10 sm:mb-14 text-sm sm:text-base max-w-md">
          Upload your CV, describe the role, and choose how the AI should pace your practice. Takes about a minute.
        </p>
        {uploadError && (
          <div className="mb-8 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
            {uploadError}
          </div>
        )}
        {submitError && (
          <div className="mb-8 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
            {submitError}
          </div>
        )}

        {/* STEP 1: UPLOAD CV */}
        <div className="mb-12 pb-12 border-b border-line">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-baseline mb-6">
            <div className="font-display text-3xl italic text-accent leading-none">i</div>
            <div>
              <div className="font-display text-3xl leading-none">Upload your CV</div>
              <div className="text-ink-soft text-sm mt-1.5">
                PDF format. The AI uses this to ask role-relevant questions.
              </div>
            </div>
          </div>

          <div className="ml-8 sm:ml-14">
            <div
              onClick={handleCvClick}
              onDragOver={handleCvDragOver}
              onDragLeave={handleCvDragLeave}
              onDrop={handleCvDrop}
              className={`border-2 border-dashed p-6 sm:p-12 text-center cursor-pointer transition-colors ${
                dragActive === "cv"
                  ? "border-accent bg-accent-bg"
                  : cvFile
                  ? "border-success bg-accent-bg"
                  : "border-line-strong bg-soft"
              }`}
            >
              {cvFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-display text-4xl text-success leading-none">✓</div>
                  <p className="text-ink font-medium">{cvFile.name}</p>
                  <div className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                    {formatFileSize(cvFile.size)} · Click to replace
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-display text-5xl italic text-accent leading-none mb-4">↑</div>
                  <p className="text-ink mb-1">
                    Drop your CV here, or <strong className="font-medium">click to browse</strong>
                  </p>
                  <div className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-2">
                    Supported · PDF · Max 10MB
                  </div>
                </>
              )}
            </div>

            <input
              type="file"
              ref={cvInputRef}
              onChange={handleCvFileChange}
              accept="application/pdf"
              className="hidden"
            />
          </div>
        </div>

        {/* STEP 2: JOB DESCRIPTION */}
        <div className="mb-12 pb-12 border-b border-line">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-baseline mb-6">
            <div className="font-display text-3xl italic text-accent leading-none">ii</div>
            <div>
              <div className="font-display text-3xl leading-none">Job description</div>
              <div className="text-ink-soft text-sm mt-1.5">
                Paste from LinkedIn or upload a PDF. The interviewer will reference this.
              </div>
            </div>
          </div>

          <div className="ml-8 sm:ml-14">
            {/* Toggle tabs */}
            <div className="flex border-b border-line mb-4">
              <div
                onClick={() => setJdInputType("pdf")}
                className={`px-5 py-3 font-mono text-xs uppercase tracking-widest cursor-pointer ${
                  jdInputType === "pdf"
                    ? "text-ink border-b-2 border-ink -mb-px"
                    : "text-ink-faint"
                }`}
              >
                Upload PDF
              </div>
              <div
                onClick={() => setJdInputType("text")}
                className={`px-5 py-3 font-mono text-xs uppercase tracking-widest cursor-pointer ${
                  jdInputType === "text"
                    ? "text-ink border-b-2 border-ink -mb-px"
                    : "text-ink-faint"
                }`}
              >
                Paste Text
              </div>
            </div>

            {jdInputType === "text" ? (
              <textarea
                id="setup-jd-textarea"
                aria-label="Job description text"
                placeholder="Paste the job description here..."
                className="w-full px-4 py-3 border border-line-strong bg-frame text-ink placeholder-ink-faint focus:outline-none focus:border-accent text-sm leading-relaxed min-h-[120px] sm:min-h-[140px] resize-y"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            ) : (
              <>
                <div
                  onClick={handleJdClick}
                  onDragOver={handleJdDragOver}
                  onDragLeave={handleJdDragLeave}
                  onDrop={handleJdDrop}
                  className={`border-2 border-dashed p-5 sm:p-8 text-center cursor-pointer transition-colors ${
                    dragActive === "jd"
                      ? "border-accent bg-accent-bg"
                      : jdFile
                      ? "border-success bg-accent-bg"
                      : "border-line-strong bg-soft"
                  }`}
                >
                  {jdFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="font-display text-3xl text-success leading-none">✓</div>
                      <p className="text-ink font-medium">{jdFile.name}</p>
                      <div className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                        {formatFileSize(jdFile.size)} · Click to replace
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-display text-3xl italic text-accent leading-none mb-3">↑</div>
                      <p className="text-ink text-sm mb-1">
                        Drop the JD here, or <strong className="font-medium">click to browse</strong>
                      </p>
                      <div className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-1">
                        Supported · PDF · Max 10MB
                      </div>
                    </>
                  )}
                </div>

                <input
                  type="file"
                  ref={jdInputRef}
                  onChange={handleJdFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {/* STEP 3: INTERVIEW MODE */}
        <div className="mb-12 pb-12 border-b border-line">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-baseline mb-6">
            <div className="font-display text-3xl italic text-accent leading-none">iii</div>
            <div>
              <div className="font-display text-3xl leading-none">Interview mode</div>
              <div className="text-ink-soft text-sm mt-1.5">
                Adaptive mode adjusts difficulty based on your answers — closer to a real interview.
              </div>
            </div>
          </div>

          <div className="ml-8 sm:ml-14 space-y-4">
            {/* Adaptive option */}
            <div
              onClick={() => setMode("adaptive")}
              className={`border p-6 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-5 items-center cursor-pointer ${
                mode === "adaptive" ? "border-accent bg-accent-bg" : "border-line-strong"
              }`}
            >
              <div className="w-[18px] h-[18px] border-2 border-accent rounded-full relative flex-shrink-0">
                {mode === "adaptive" && (
                  <div className="absolute inset-[3px] bg-accent rounded-full" />
                )}
              </div>
              <div>
                <div className="font-medium text-base mb-1">Adaptive</div>
                <div className="text-ink-soft text-sm">
                  AI generates questions dynamically and decides when to stop. Length: 6–10 questions.
                </div>
              </div>
              <div className="hidden sm:block font-mono text-xs uppercase tracking-widest text-accent">
                Recommended
              </div>
            </div>

            {/* Fixed length option */}
            <div
              onClick={() => setMode("fixed")}
              className={`border p-6 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-5 items-start sm:items-center cursor-pointer ${
                mode === "fixed" ? "border-accent bg-accent-bg" : "border-line-strong"
              }`}
            >
              <div className={`w-[18px] h-[18px] border-2 rounded-full relative flex-shrink-0 ${
                mode === "fixed" ? "border-accent" : "border-line-strong"
              }`}>
                {mode === "fixed" && (
                  <div className="absolute inset-[3px] bg-accent rounded-full" />
                )}
              </div>
              <div>
                <div className="font-medium text-base mb-1">Fixed length</div>
                <div className="text-ink-soft text-sm">
                  Pre-decide how many questions. Useful for time-boxed practice.
                </div>
              </div>
              {/* Question count pills */}
              <div
                className={`col-span-2 sm:col-span-1 flex flex-wrap gap-2 ${mode === "adaptive" ? "opacity-50" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                {([5, 7, 10] as const).map((n) => (
                  <div
                    key={n}
                    onClick={() => handlePillClick(n)}
                    className={`${pillClass(n)} ${mode === "adaptive" ? "cursor-not-allowed" : ""}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AUDIO STORAGE TOGGLE */}
        <div className="mb-10 sm:mb-14 ml-8 sm:ml-14">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={saveAudio}
              onChange={() => setSaveAudio((prev) => !prev)}
            />
            <div
              className={`w-[18px] h-[18px] mt-1 flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                saveAudio ? "bg-accent border-accent" : "border-line-strong"
              }`}
            >
              {saveAudio && (
                <svg
                  className="w-3 h-3 text-page"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-medium text-base mb-1">Save audio recordings</div>
              <div className="text-ink-soft text-sm">
                Allows you to replay your answers when reviewing. Audio auto-deleted after 30 days.
              </div>
            </div>
          </label>
        </div>

        {/* SUBMIT */}
        <div className="ml-8 sm:ml-14">
          <button
            disabled={!isFormValid || submitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-ink text-page px-8 sm:px-10 py-4 sm:py-5 font-mono text-sm sm:text-base uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Generating..." : (
              <>
                Generate interview
                <span className="font-display italic text-2xl">→</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default SetupPage;
