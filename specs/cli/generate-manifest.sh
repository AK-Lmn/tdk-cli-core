#!/usr/bin/env bash
# =============================================================================
# 🎯 TDK Landscape - SERVICE MANIFEST GENERATOR
# =============================================================================
# Usage: ./generate-manifest.sh <domain> <service-name> <type> [port]
#
# Examples:
#   ./generate-manifest.sh salon salon-management backend 4000
#   ./generate-manifest.sh appointment booking frontend 3002
#   ./generate-manifest.sh notification email worker 6001
#
# Debug Mode:
#   TILT_DEBUG=true ./generate-manifest.sh salon salon-management backend 4000
# =============================================================================

set -euo pipefail

# Enable debug mode if TILT_DEBUG is set
if [[ "${TILT_DEBUG:-false}" == "true" ]]; then
    set -x  # Print every command before executing it
    echo "🛠️ DEBUG MODE ENABLED"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

print_usage() {
    cat << EOF
${BLUE}╔═══════════════════════════════════════════════════════════════════╗
║  🎯  TDK Landscape SERVICE MANIFEST GENERATOR                         ║
╚═══════════════════════════════════════════════════════════════════╝${NC}

${YELLOW}Usage:${NC}
  $0 <domain> <service-name> <type> [port]

${YELLOW}Arguments:${NC}
  domain        Business domain (salon, staff, appointment, treatment, etc.)
  service-name  Service name without type suffix (e.g., 'management', 'booking')
  type          Service type: backend, frontend, worker, sdk
  port          (Optional) Port number. Auto-assigned if not specified.

${YELLOW}Examples:${NC}
  $0 salon management backend 4000
  $0 appointment booking frontend 3002
  $0 notification email worker

${YELLOW}Port Conventions:${NC}
  Backend:   4000-5999
  Frontend:  3000-3999
  Worker:    6000-6999

${YELLOW}This will create:${NC}
  services/product/{domain}/{domain}-{name}-{type}/
    └── platform-computing-provisioner.manifest.json

EOF
}

# Validate domain
VALID_DOMAINS=("salon" "staff" "identity" "appointment" "treatment" "inventory" "billing" "notification" "analytics")

validate_domain() {
    local domain=$1
    for valid in "${VALID_DOMAINS[@]}"; do
        if [[ "$domain" == "$valid" ]]; then
            return 0
        fi
    done
    return 1
}

# Validate type
VALID_TYPES=("backend" "frontend" "worker" "sdk" "migrator")

validate_type() {
    local type=$1
    for valid in "${VALID_TYPES[@]}"; do
        if [[ "$type" == "$valid" ]]; then
            return 0
        fi
    done
    return 1
}

# Get default port based on type
get_default_port() {
    local type=$1
    case "$type" in
        backend)  echo 4099 ;;
        frontend) echo 3099 ;;
        worker)   echo 6099 ;;
        *)        echo 8000 ;;
    esac
}

# Get features based on type
get_default_features() {
    local type=$1
    case "$type" in
        backend)  echo '["nats", "prisma", "traefik", "infisical"]' ;;
        frontend) echo '["vitest"]' ;;
        worker)   echo '["nats", "infisical"]' ;;
        sdk)      echo '["vitest"]' ;;
        *)        echo '[]' ;;
    esac
}

# Main
main() {
    if [[ $# -lt 3 ]]; then
        print_usage
        exit 1
    fi

    local domain="$1"
    local service_name="$2"
    local service_type="$3"
    local port="${4:-$(get_default_port "$service_type")}"

    # Validate inputs
    if ! validate_domain "$domain"; then
        echo -e "${RED}❌ Invalid domain: ${domain}${NC}"
        echo -e "   Valid domains: ${VALID_DOMAINS[*]}"
        exit 1
    fi

    if ! validate_type "$service_type"; then
        echo -e "${RED}❌ Invalid type: ${service_type}${NC}"
        echo -e "   Valid types: ${VALID_TYPES[*]}"
        exit 1
    fi

    # Construct full service name
    local full_name="${domain}-${service_name}-${service_type}"
    local service_dir="${PROJECT_ROOT}/services/product/${domain}/${full_name}"
    local manifest_file="${service_dir}/platform-computing-provisioner.manifest.json"

    # Check if directory already exists
    if [[ -d "$service_dir" ]]; then
        echo -e "${YELLOW}⚠️  Directory already exists: ${service_dir}${NC}"
        if [[ -f "$manifest_file" ]]; then
            echo -e "${RED}❌ Manifest already exists. Aborting.${NC}"
            exit 1
        fi
        echo -e "${BLUE}   Creating manifest in existing directory...${NC}"
    else
        echo -e "${BLUE}📁 Creating service directory: ${service_dir}${NC}"
        mkdir -p "$service_dir"
    fi

    # Get features
    local features
    features=$(get_default_features "$service_type")

    # Build dependencies based on type
    local deps='[]'
    if [[ "$service_type" == "backend" && "$domain" != "identity" ]]; then
        deps='["identity"]'
    fi

    # Generate manifest JSON
    cat > "$manifest_file" << EOF
{
  "\$schema": "../../.tilt/schemas/manifest-schema.json",
  "appName": "${full_name}",
  "appType": "${service_type}",
  "domain": "${domain}",
  "port": ${port},
  "replicas": 1,
  "features": ${features},
  "internalDependencies": ${deps}
}
EOF

    echo -e "${GREEN}✅ Created manifest: ${manifest_file}${NC}"
    echo ""
    echo -e "${BLUE}📋 Generated manifest:${NC}"
    cat "$manifest_file"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "   1. Review and customize the manifest"
    echo "   2. Add source files to ${service_dir}/src/"
    echo "   3. Create package.json if needed"
    echo "   4. Run 'tilt up' to discover the new service"
    echo ""
    echo -e "${GREEN}🎉 Done! Service '${full_name}' is ready for development.${NC}"
}

main "$@"
