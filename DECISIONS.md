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