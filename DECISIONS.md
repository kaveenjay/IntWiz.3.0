# Technical Decisions

## Why Groq over OpenAI?
- Cost: OpenAI charges per token, Groq is free
- Regional access: Sri Lanka blocked from some free tiers
- Speed: Groq's custom LPU chips give 5-10x faster inference


## Why 16kHz audio not 22kHz?
- Whisper model expects 16kHz input
- Lower sample rate = smaller files = faster upload
- 16kHz captures all human speech frequencies (20Hz-8kHz)



## Why 8 Points Per Filler Word in Fluency Scoring?
**Decision:** Fluency score penalizes 8 points per detected filler word

**Context:**
The fluency scoring system starts at 100 (perfect) and deducts points based on the number of hesitation markers (um, uh, like, you know, etc.) detected in the transcript.

**Alternatives Considered:**
- **5 points per filler:** Too lenient — a candidate with 10 fillers would still score 50, masking a significant fluency issue
- **10 points per filler:** Too harsh — a candidate with just 3 fillers would score 70, which doesn't reflect the minor nature of occasional hesitation
- **Dynamic/ML-based scoring:** Would require a labeled dataset of human expert fluency ratings, which is unavailable at the prototype stage

**Justification:**
The value 8 was selected through calibration to create intuitive scoring breakpoints:

| Filler Count | Score | Interpretation |
|--------------|-------|----------------|
| 0 | 100 | Perfect fluency |
| 2-3 | 76-92 | Good (minor hesitation) |
| 5 | 60 | Acceptable threshold |
| 7-8 | 36-44 | Poor (noticeable issue) |
| 12+ | 0-4 | Critical fluency problem |

This ensures that:
- Minor hesitation (2-3 fillers) keeps the candidate in a "good" range
- Moderate use (5-7 fillers) signals "needs improvement" 
- Heavy use (10+ fillers) clearly flags a significant issue

**Implementation:**
The penalty is defined as a named constant `FILLER_PENALTY = 8` in `audio_utils.py`, making it easily configurable for future tuning.

**Limitations and Future Work:**
This is a **calibrated heuristic** rather than an empirically validated constant. In a production system, this value should be optimized using:
1. Collection of interview transcripts with varying filler word counts
2. Human expert ratings of fluency for each transcript
3. Regression analysis to find the penalty weight that maximizes correlation with expert assessments

The current value of 8 provides reasonable relative rankings for demonstration and testing purposes but has not been validated against ground truth fluency ratings.

**Academic Note:**
This design decision reflects a common trade-off in applied AI systems: starting with reasonable heuristics for rapid prototyping, then validating against empirical data before production deployment. The use of a configurable constant (rather than a hard-coded magic number) demonstrates engineering best practices for systems expected to evolve.


## Why TF-IDF Over Neural Embeddings for Relevance Scoring?

**Decision:** Use sklearn TF-IDF + cosine similarity for semantic relevance matching

**Alternatives Considered:**
- **BERT/Sentence Transformers:** Pre-trained transformer models that understand semantic meaning beyond exact word matches
- **Word2Vec/GloVe:** Word embedding models trained on large corpora
- **Hybrid approach:** Combine TF-IDF (keyword matching) with BERT (semantic matching)

**Justification:**

| Factor | TF-IDF | BERT | Hybrid |
|--------|--------|------|--------|
| Inference Speed | ~5ms | ~200-500ms | ~200-500ms |
| Model Size | 0MB (no weights) | 400MB+ | 400MB+ |
| Synonym Handling | ❌ Poor | ✅ Excellent | ✅ Excellent |
| Keyword Precision | ✅ Exact matches | ⚠️ May over-generalize | ✅ Best of both |
| Deterministic | ✅ Always | ❌ Model version dependent | ❌ Model dependent |
| Explainability | ✅ Clear | ❌ Black box | ⚠️ Complex |

**Why TF-IDF Was Selected:**

1. **Computational Efficiency:** Real-time interview systems require sub-second response times. TF-IDF's 5ms inference allows for responsive user experience, while BERT's 200-500ms latency would introduce noticeable delays.

2. **Keyword Specificity in Technical Contexts:** For technical interviews, exact terminology usage is a signal of domain expertise. When a job description requires "Python" and a candidate says "a popular programming language," TF-IDF correctly scores this as low relevance, whereas BERT might incorrectly match them semantically.

3. **Determinism:** TF-IDF produces identical results for identical inputs, which:
   - Aids debugging during development
   - Ensures reproducible results for testing
   - Allows clear explanation to users ("You scored low because you didn't mention Python, SQL, or data visualization")

4. **Deployment Constraints:** Free-tier cloud hosting (target for student project) often has:
   - RAM limits (512MB-1GB) — BERT models require 2GB+
   - No GPU access — BERT on CPU is 5-10x slower
   - Storage limits — 400MB model files significant overhead

**Acknowledged Limitations:**

TF-IDF cannot handle:
- Synonyms: "machine learning" vs "ML"
- Paraphrasing: "data analysis" vs "examining datasets"
- Semantic similarity: "Python programming" vs "writing code in Python"

This means candidates who express ideas differently (but correctly) may score lower than they should.

**Future Work:**

A production system could implement **lightweight hybrid scoring**:
1. Use `sentence-transformers/all-MiniLM-L6-v2` (80MB model, 50ms inference)
2. Calculate both TF-IDF and embedding similarity
3. Weighted combination: `final_score = (0.6 × tfidf_score) + (0.4 × embedding_score)`
4. Validate weights using A/B testing against user feedback

For the current prototype, TF-IDF provides sufficient relevance detection while maintaining the system's core objectives of speed and explainability.

---

## Acoustic Model Limitations — Training Data Mismatch

**Issue Identified:** Confidence and engagement scores often appear lower than expected for professional interview speech

**Root Cause:**
The emotion recognition model was trained on datasets of **acted emotional expressions** (RAVDESS, TESS, CREMA-D, SAVEE) where professional actors perform exaggerated emotions for research purposes. This creates a fundamental distribution mismatch when the model is applied to real-world interview speech.

**Specific Problems:**

### 1. Engagement Score Bias
The engagement calculation uses:
```python
raw_engagement = (energy_std * 1000) + (pitch_std / 20)
```

This formula rewards:
- **High volume variation** (energy_std) = interpreted as "engaged"
- **High pitch variation** (pitch_std) = interpreted as "dynamic"

However, in professional interview contexts:
- **Controlled volume** = signals confidence (but scores LOW on energy_std)
- **Stable pitch** = signals composure (but scores LOW on pitch_std)
- **Nervous delivery** with erratic pitch/volume = scores HIGH (incorrectly)

**The formula optimizes for theatrical expressiveness, not professional communication quality.**

### 2. Emotion Classification Accuracy
Training data emotions are exaggerated theatrical performances:
- "Happy" in RAVDESS = enthusiastic, high-pitched, energetic
- "Angry" in CREMA-D = loud, aggressive, intense
- "Neutral" in TESS = flat, monotone, deliberately unexpressive

Real interview speech is measured and controlled:
- Professional confidence is steady and calm
- This often gets misclassified as "neutral" or even "disgust" (low arousal emotions)
- Conversely, nervous energy might score higher on engagement metrics

### 3. Empirical Evidence
Testing with identical text but different delivery styles:

| Delivery Style | Detected Tone | Confidence | Engagement | Expected Rating |
|----------------|---------------|------------|------------|-----------------|
| Flat/monotone recording | disgust | 37% | 31.31 | Should be "poor" ✅ |
| Energetic/higher pitch | neutral | 62% | 39.63 | Should be "good" ❌ |
| Professional/controlled | neutral | 62% | 39.63 | Should be "excellent" ❌ |

The model cannot distinguish between "professional composure" and "low engagement."

**Why This Wasn't Detected During Development:**
- Model validation used held-out samples from the same acted speech datasets
- Validation accuracy (65%) reflected performance on similar theatrical data
- No validation was performed on real interview audio (unavailable during training)
- This is a **dataset domain shift problem**, not a modeling error

**Current System Impact:**
- **Acoustic features (emotion, engagement):** Limited reliability for interview assessment
- **Linguistic features (fluency, relevance, STAR):** Perform accurately on real speech
- System remains functional as a **multimodal demonstrator** but acoustic scores should be weighted lower in final scoring

**Mitigation Strategies Considered:**

| Strategy | Feasibility | Impact |
|----------|-------------|--------|
| Fine-tune on interview data | ❌ No labeled interview corpus available | High |
| Lower acoustic score weights | ✅ Implemented in scoring fusion (Phase 3) | Medium |
| Retrain engagement formula | ❌ Requires ground truth labels | High |
| Add calibration warnings to UI | ✅ Could implement | Low |
| Replace with pause/filler metrics | ✅ Already have filler detection | Medium |

**Future Work — Production Requirements:**

To deploy this system for actual interview preparation, the acoustic model would require:

1. **Domain-Specific Training Data:**
   - Collect 500+ real interview recordings
   - Have HR professionals/interview coaches label each for:
     * Confidence level (1-10 scale)
     * Engagement quality (1-10 scale)
     * Professionalism (1-10 scale)
   - Fine-tune model on this labeled interview corpus

2. **Engagement Metric Redesign:**
   - Current: `(volume_variance × 1000) + (pitch_variance / 20)`
   - Proposed: Combination of:
     * Speech rate consistency (steady pace = confident)
     * Pause patterns (natural pauses = composed, excessive = hesitant)
     * Filler word ratio (already implemented)
     * Volume floor (too quiet = uncertain, steady moderate = professional)

3. **Multi-Task Learning:**
   - Train single model with multiple outputs:
     * Emotion classification
     * Confidence regression
     * Engagement regression
     * Interview suitability binary classification
   - Shared representations but task-specific heads

**Academic Value of This Limitation:**

This finding itself constitutes a research contribution: it empirically demonstrates that **emotion recognition models trained on acted speech do not generalize to professional communication contexts**, even though both domains involve human speech.

This highlights:
- The critical importance of domain-matched training data
- The risk of deploying academic datasets in production contexts without validation
- The difference between "emotion" (what the person feels) and "delivery quality" (how professionally they communicate)

**Conclusion:**

The acoustic model serves its purpose as a proof-of-concept for multimodal analysis architecture. However, the current implementation prioritizes **linguistic analysis** (fluency, relevance, STAR structure) which performs reliably on real interview speech. The acoustic features remain in the system to demonstrate the multimodal approach but should be weighted appropriately in final scoring until domain-specific recalibration is performed.