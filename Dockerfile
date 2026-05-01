# =============================================================================
# Karate Petstore Test Suite — Docker Image
#
# Multi-stage build:
#   Stage 1 (builder):  Resolve Maven dependencies & compile
#   Stage 2 (runtime):  Slim Alpine JRE + Maven for test execution
#
# Usage:
#   docker build -t karate-petstore .
#   docker run --rm -e MAVEN_PROFILE=mock karate-petstore
#   docker run --rm -e MAVEN_PROFILE=smoke -e KARATE_ENV=qa karate-petstore
# =============================================================================

# ── Stage 1: Build dependencies & compile ──────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy pom.xml first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:resolve -q

# Copy source and compile (skip tests — we only need compiled classes + resources)
COPY src src
RUN mvn package -DskipTests -q

# Collect artifacts for the runtime stage
RUN mkdir -p /app/artifacts && \
    cp -r target /app/artifacts/target

# ── Stage 2: Slim runtime image ────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# Install Maven (Alpine package ~18 MB)
RUN apk add --no-cache maven

WORKDIR /app

# Copy Maven local repository cache from builder (avoids re-download)
COPY --from=builder /root/.m2 /root/.m2

# Copy project files
COPY --from=builder /build/pom.xml .
COPY --from=builder /build/src src

# Environment variables with sensible defaults
ENV KARATE_ENV=dev
ENV MAVEN_PROFILE=
ENV KARATE_OPTIONS=
ENV REPORT_DIR=/app/target

# Expose mock server port (used by MockRunner)
EXPOSE 9876

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
