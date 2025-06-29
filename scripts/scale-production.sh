#!/bin/bash

# ========================================
# GangGPT Production Scaling Automation
# Intelligent auto-scaling management
# ========================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
NAMESPACE="ganggpt-production"
MIN_REPLICAS=2
MAX_REPLICAS=50
TARGET_CPU=70
TARGET_MEMORY=80
SCALE_UP_COOLDOWN=300
SCALE_DOWN_COOLDOWN=600

# Function to log messages
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

info() { log "${BLUE}[INFO]${NC} $1"; }
warn() { log "${YELLOW}[WARN]${NC} $1"; }
error() { log "${RED}[ERROR]${NC} $1"; }
success() { log "${GREEN}[SUCCESS]${NC} $1"; }

# Function to get current metrics
get_current_metrics() {
    local deployment=$1
    
    kubectl top pods -n "$NAMESPACE" -l "app=$deployment" --no-headers | awk '
    BEGIN { cpu_sum=0; memory_sum=0; count=0 }
    {
        gsub(/m/, "", $2); cpu_sum += $2
        gsub(/Mi/, "", $3); memory_sum += $3
        count++
    }
    END {
        if (count > 0) {
            print cpu_sum/count, memory_sum/count, count
        } else {
            print 0, 0, 0
        }
    }'
}

# Function to get current replica count
get_replica_count() {
    local deployment=$1
    kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0"
}

# Function to scale deployment
scale_deployment() {
    local deployment=$1
    local replicas=$2
    
    info "Scaling $deployment to $replicas replicas..."
    kubectl scale deployment "$deployment" --replicas="$replicas" -n "$NAMESPACE"
    
    # Wait for scaling to complete
    kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=300s
    success "$deployment scaled to $replicas replicas"
}

# Function to calculate optimal replicas
calculate_optimal_replicas() {
    local current_cpu=$1
    local current_memory=$2
    local current_replicas=$3
    local target_cpu=$4
    local target_memory=$5
    
    # Calculate required replicas based on CPU and memory
    local cpu_required_replicas=$(echo "$current_cpu $target_cpu $current_replicas" | awk '{print int(($1 / $2) * $3) + 1}')
    local memory_required_replicas=$(echo "$current_memory $target_memory $current_replicas" | awk '{print int(($1 / $2) * $3) + 1}')
    
    # Use the higher requirement
    local required_replicas=$cpu_required_replicas
    if [[ $memory_required_replicas -gt $cpu_required_replicas ]]; then
        required_replicas=$memory_required_replicas
    fi
    
    # Ensure within bounds
    if [[ $required_replicas -lt $MIN_REPLICAS ]]; then
        required_replicas=$MIN_REPLICAS
    elif [[ $required_replicas -gt $MAX_REPLICAS ]]; then
        required_replicas=$MAX_REPLICAS
    fi
    
    echo $required_replicas
}

# Function to monitor and scale single deployment
monitor_deployment() {
    local deployment=$1
    
    info "Monitoring deployment: $deployment"
    
    # Get current metrics
    read -r cpu memory replicas <<< "$(get_current_metrics "$deployment")"
    local current_replicas=$(get_replica_count "$deployment")
    
    info "Current metrics - CPU: ${cpu}m, Memory: ${memory}Mi, Replicas: $current_replicas"
    
    # Calculate optimal replicas
    local optimal_replicas=$(calculate_optimal_replicas "$cpu" "$memory" "$current_replicas" "$TARGET_CPU" "$TARGET_MEMORY")
    
    # Check if scaling is needed
    if [[ $optimal_replicas -ne $current_replicas ]]; then
        if [[ $optimal_replicas -gt $current_replicas ]]; then
            warn "High resource usage detected - scaling up from $current_replicas to $optimal_replicas"
        else
            info "Low resource usage detected - scaling down from $current_replicas to $optimal_replicas"
        fi
        
        scale_deployment "$deployment" "$optimal_replicas"
    else
        success "$deployment is optimally scaled at $current_replicas replicas"
    fi
}

# Function to monitor cluster resources
monitor_cluster_resources() {
    info "Checking cluster resource availability..."
    
    local node_count=$(kubectl get nodes --no-headers | wc -l)
    local total_cpu=$(kubectl top nodes --no-headers | awk '{sum += $2} END {print sum}')
    local total_memory=$(kubectl top nodes --no-headers | awk '{gsub(/Mi/, "", $4); sum += $4} END {print sum}')
    
    info "Cluster status - Nodes: $node_count, Total CPU: ${total_cpu}m, Total Memory: ${total_memory}Mi"
    
    # Check if cluster is under stress
    local avg_cpu_per_node=$((total_cpu / node_count))
    local avg_memory_per_node=$((total_memory / node_count))
    
    if [[ $avg_cpu_per_node -gt 800 ]] || [[ $avg_memory_per_node -gt 6000 ]]; then
        warn "Cluster is under high load - consider adding more nodes"
        return 1
    fi
    
    return 0
}

# Function to apply HPA (Horizontal Pod Autoscaler)
apply_hpa() {
    local deployment=$1
    
    info "Applying HPA for $deployment..."
    
    cat << EOF | kubectl apply -f -
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${deployment}-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $deployment
  minReplicas: $MIN_REPLICAS
  maxReplicas: $MAX_REPLICAS
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: $TARGET_CPU
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: $TARGET_MEMORY
  behavior:
    scaleUp:
      stabilizationWindowSeconds: $SCALE_UP_COOLDOWN
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: $SCALE_DOWN_COOLDOWN
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 1
        periodSeconds: 60
EOF

    success "HPA applied for $deployment"
}

# Function to monitor all deployments
monitor_all_deployments() {
    local deployments=("ganggpt-web" "ganggpt-backend")
    
    info "Starting comprehensive deployment monitoring..."
    
    # Check cluster health first
    if ! monitor_cluster_resources; then
        warn "Cluster is under stress - scaling decisions may be conservative"
    fi
    
    # Monitor each deployment
    for deployment in "${deployments[@]}"; do
        monitor_deployment "$deployment"
        echo ""
    done
}

# Function to setup auto-scaling
setup_autoscaling() {
    info "Setting up auto-scaling for GangGPT deployments..."
    
    local deployments=("ganggpt-web" "ganggpt-backend")
    
    for deployment in "${deployments[@]}"; do
        apply_hpa "$deployment"
    done
    
    success "Auto-scaling configured for all deployments"
}

# Function to show scaling status
show_scaling_status() {
    info "Current scaling status:"
    
    echo ""
    info "Horizontal Pod Autoscalers:"
    kubectl get hpa -n "$NAMESPACE"
    
    echo ""
    info "Deployment status:"
    kubectl get deployments -n "$NAMESPACE"
    
    echo ""
    info "Pod resource usage:"
    kubectl top pods -n "$NAMESPACE"
}

# Function to emergency scale up
emergency_scale_up() {
    warn "Emergency scale-up triggered!"
    
    local deployments=("ganggpt-web" "ganggpt-backend")
    local emergency_replicas=10
    
    for deployment in "${deployments[@]}"; do
        scale_deployment "$deployment" "$emergency_replicas"
    done
    
    success "Emergency scale-up completed"
}

# Function to display usage
usage() {
    cat << EOF
GangGPT Production Scaling Script

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    monitor             Monitor and adjust scaling for all deployments
    setup              Setup auto-scaling (HPA) for deployments
    status             Show current scaling status
    emergency          Emergency scale-up all deployments
    scale DEPLOYMENT REPLICAS  Manually scale specific deployment

OPTIONS:
    --namespace NS     Kubernetes namespace [default: ganggpt-production]
    --min-replicas N   Minimum replicas [default: 2]
    --max-replicas N   Maximum replicas [default: 50]
    --target-cpu N     Target CPU utilization % [default: 70]
    --target-memory N  Target memory utilization % [default: 80]

EXAMPLES:
    $0 monitor
    $0 setup --min-replicas 3 --max-replicas 100
    $0 scale ganggpt-web 5
    $0 emergency

EOF
}

# Main function
main() {
    local command="${1:-monitor}"
    shift || true
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --min-replicas)
                MIN_REPLICAS="$2"
                shift 2
                ;;
            --max-replicas)
                MAX_REPLICAS="$2"
                shift 2
                ;;
            --target-cpu)
                TARGET_CPU="$2"
                shift 2
                ;;
            --target-memory)
                TARGET_MEMORY="$2"
                shift 2
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    case $command in
        monitor)
            monitor_all_deployments
            ;;
        setup)
            setup_autoscaling
            ;;
        status)
            show_scaling_status
            ;;
        emergency)
            emergency_scale_up
            ;;
        scale)
            if [[ $# -ge 2 ]]; then
                scale_deployment "$1" "$2"
            else
                error "Scale command requires deployment name and replica count"
                exit 1
            fi
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
