#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Karate Petstore Test Suite Entrypoint
#
# Translates environment variables into the equivalent Maven command.
#
# Environment variables:
#   KARATE_ENV      — Target environment (dev / qa / staging). Default: dev
#   MAVEN_PROFILE   — Maven profile (smoke / regression / mock / performance).
#                     Empty = MasterRunner (full suite).
#   KARATE_OPTIONS  — Extra Karate CLI options, e.g. "--tags @smoke"
#                     or "-Dkarate.options=--tags @performance".
# =============================================================================
set -e

# Base command
CMD="mvn test"

# Append Maven profile if set
if [ -n "$MAVEN_PROFILE" ]; then
    CMD="$CMD -P$MAVEN_PROFILE"
fi

# Append environment
CMD="$CMD -Dkarate.env=$KARATE_ENV"

# Append extra Karate options if provided
if [ -n "$KARATE_OPTIONS" ]; then
    # Support both --tags and -Dkarate.options= format
    case "$KARATE_OPTIONS" in
        -D*) CMD="$CMD $KARATE_OPTIONS" ;;
        *)   CMD="$CMD -Dkarate.options=\"$KARATE_OPTIONS\"" ;;
    esac
fi

echo "[entrypoint] Running: $CMD"
echo "[entrypoint] Environment: KARATE_ENV=$KARATE_ENV  MAVEN_PROFILE=$MAVEN_PROFILE"
exec $CMD
