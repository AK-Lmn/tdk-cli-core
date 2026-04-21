#!/bin/sh
# Wrapper script that calls the Node.js implementation
exec node "$(dirname "$0")/republish-needed.js" "$@"
