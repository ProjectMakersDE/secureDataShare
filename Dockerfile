FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ .

# Create uploads directory
RUN mkdir -p /uploads

# Set environment variables
ENV PORT=8101
ENV UPLOAD_FOLDER=/uploads

EXPOSE 8101

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8101", "--workers", "2", "--timeout", "600", "app:app"]
