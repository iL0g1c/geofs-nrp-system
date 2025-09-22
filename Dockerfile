# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/opt/nrp-site

# Install Node.js and system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get purge -y --auto-remove curl gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR ${APP_HOME}

# Install Python dependencies
COPY src/server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies for the Express app
WORKDIR ${APP_HOME}/src/server/nrp-site
COPY src/server/nrp-site/package*.json ./
RUN npm install

# Copy the rest of the application source
WORKDIR ${APP_HOME}
COPY src ./src

WORKDIR ${APP_HOME}/src/server

# Expose the ports used by the Express server and BrowserSync proxy
EXPOSE 3000 3001 8000

CMD ["python", "/opt/nrp-site/src/server/server_launcher.py"]
