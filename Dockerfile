# 1. Use Python 3.10 (Stable for TensorFlow)
FROM python:3.10-slim

# 2. Set working directory inside the container
WORKDIR /code

# 3. Install system dependencies (needed for some ML math libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy requirements file first (for caching)
COPY ./backend/requirements.txt /code/requirements.txt

# 5. Install Python libraries
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 6. Copy the entire backend folder
COPY ./backend /code/backend

# 7. Start the server
# Note: We use port 80 because Render expects it
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "80"]