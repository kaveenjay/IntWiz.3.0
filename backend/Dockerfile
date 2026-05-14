FROM python:3.11-slim

# Hugging Face Spaces requires the app to run on port 7860 by default
ENV PORT=7860

# Install system dependencies for librosa/audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Hugging Face requires a non-root user with UID 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# Copy and install Python dependencies first (better Docker layer caching)
COPY --chown=user:user requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy the rest of the backend code
COPY --chown=user:user . /code

# HF Spaces expects the app on 0.0.0.0:7860
EXPOSE 7860

# Start the FastAPI app via uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
