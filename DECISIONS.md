# Technical Decisions

## Why Groq over OpenAI?
- Cost: OpenAI charges per token, Groq is free
- Regional access: Sri Lanka blocked from some free tiers
- Speed: Groq's custom LPU chips give 5-10x faster inference

## Why 16kHz audio not 22kHz?
- Whisper model expects 16kHz input
- Lower sample rate = smaller files = faster upload
- 16kHz captures all human speech frequencies (20Hz-8kHz)