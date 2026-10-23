#!/bin/sh
set -e

# Ensure data directory exists and is writable by node user
mkdir -p "${DATA_DIR:-/app/data}"
chown -R node:node "${DATA_DIR:-/app/data}" 2>/dev/null || chmod 777 "${DATA_DIR:-/app/data}" 2>/dev/null || true

# Execute passed command as node user
exec su-exec node "$@"
