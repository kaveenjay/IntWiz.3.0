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