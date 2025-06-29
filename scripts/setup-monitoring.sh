#!/bin/bash

# ========================================
# GangGPT Monitoring Dashboard Setup
# Complete observability stack deployment
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

# Configuration
MONITORING_NAMESPACE="ganggpt-monitoring"
GRAFANA_ADMIN_PASSWORD="admin123"
PROMETHEUS_RETENTION="30d"
LOKI_RETENTION="720h"

# Function to log messages
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

info() { log "${BLUE}[INFO]${NC} $1"; }
warn() { log "${YELLOW}[WARN]${NC} $1"; }
error() { log "${RED}[ERROR]${NC} $1"; }
success() { log "${GREEN}[SUCCESS]${NC} $1"; }

# Function to check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    success "Prerequisites check completed"
}

# Function to create monitoring namespace
create_namespace() {
    info "Creating monitoring namespace..."
    
    kubectl create namespace "$MONITORING_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    success "Monitoring namespace created/updated"
}

# Function to deploy Prometheus
deploy_prometheus() {
    info "Deploying Prometheus..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: ganggpt-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: ganggpt-production
        replica: prometheus-1
    
    rule_files:
      - "ganggpt_rules.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
    
    scrape_configs:
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
      
      - job_name: 'ganggpt-backend'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - ganggpt-production
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: ganggpt-backend
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: metrics
      
      - job_name: 'ganggpt-web'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - ganggpt-production
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: ganggpt-web
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: metrics
      
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https
      
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/${1}/proxy/metrics
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

  ganggpt_rules.yml: |
    groups:
      - name: ganggpt.rules
        rules:
          - alert: HighCPUUsage
            expr: rate(container_cpu_usage_seconds_total{container!="POD",container!=""}[5m]) * 100 > 80
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High CPU usage detected"
              description: "CPU usage is above 80% for {{ $labels.container }} in {{ $labels.namespace }}"
          
          - alert: HighMemoryUsage
            expr: (container_memory_working_set_bytes{container!="POD",container!=""} / container_spec_memory_limit_bytes) * 100 > 90
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High memory usage detected"
              description: "Memory usage is above 90% for {{ $labels.container }} in {{ $labels.namespace }}"
          
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} in {{ $labels.namespace }} is crash looping"
          
          - alert: ServiceDown
            expr: up == 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Service is down"
              description: "Service {{ $labels.job }} is down"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: ganggpt-monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
        - name: prometheus
          image: prom/prometheus:v2.40.0
          ports:
            - containerPort: 9090
          args:
            - --config.file=/etc/prometheus/prometheus.yml
            - --storage.tsdb.path=/prometheus/
            - --storage.tsdb.retention.time=30d
            - --web.console.libraries=/etc/prometheus/console_libraries
            - --web.console.templates=/etc/prometheus/consoles
            - --web.enable-lifecycle
            - --web.route-prefix=/
          volumeMounts:
            - name: prometheus-config
              mountPath: /etc/prometheus/
            - name: prometheus-storage
              mountPath: /prometheus/
          resources:
            requests:
              memory: "512Mi"
              cpu: "200m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
      volumes:
        - name: prometheus-config
          configMap:
            name: prometheus-config
        - name: prometheus-storage
          emptyDir: {}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: ganggpt-monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
  - apiGroups: [""]
    resources:
      - nodes
      - nodes/proxy
      - services
      - endpoints
      - pods
    verbs: ["get", "list", "watch"]
  - apiGroups:
      - extensions
    resources:
      - ingresses
    verbs: ["get", "list", "watch"]
  - nonResourceURLs: ["/metrics"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: ganggpt-monitoring
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: ganggpt-monitoring
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: ClusterIP
EOF

    success "Prometheus deployed"
}

# Function to deploy Grafana
deploy_grafana() {
    info "Deploying Grafana..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: ganggpt-monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus:9090
        access: proxy
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki:3100
        access: proxy
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: ganggpt-monitoring
data:
  dashboards.yaml: |
    apiVersion: 1
    providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        updateIntervalSeconds: 10
        options:
          path: /var/lib/grafana/dashboards
  
  ganggpt-overview.json: |
    {
      "dashboard": {
        "id": null,
        "title": "GangGPT Overview",
        "tags": ["ganggpt"],
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "Active Players",
            "type": "stat",
            "targets": [
              {
                "expr": "ganggpt_active_players_total",
                "refId": "A"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
          },
          {
            "id": 2,
            "title": "CPU Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(container_cpu_usage_seconds_total{namespace=\"ganggpt-production\"}[5m]) * 100",
                "refId": "A"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
          },
          {
            "id": 3,
            "title": "Memory Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "container_memory_working_set_bytes{namespace=\"ganggpt-production\"} / 1024 / 1024",
                "refId": "A"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
          },
          {
            "id": 4,
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total{namespace=\"ganggpt-production\"}[5m])",
                "refId": "A"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
          }
        ],
        "refresh": "30s",
        "schemaVersion": 16,
        "version": 0
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: ganggpt-monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:9.2.0
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              value: "admin123"
            - name: GF_USERS_ALLOW_SIGN_UP
              value: "false"
          volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
            - name: grafana-datasources
              mountPath: /etc/grafana/provisioning/datasources
            - name: grafana-dashboards-config
              mountPath: /etc/grafana/provisioning/dashboards
            - name: grafana-dashboards
              mountPath: /var/lib/grafana/dashboards
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "200m"
      volumes:
        - name: grafana-storage
          emptyDir: {}
        - name: grafana-datasources
          configMap:
            name: grafana-datasources
        - name: grafana-dashboards-config
          configMap:
            name: grafana-dashboards
            items:
              - key: dashboards.yaml
                path: dashboards.yaml
        - name: grafana-dashboards
          configMap:
            name: grafana-dashboards
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: ganggpt-monitoring
spec:
  selector:
    app: grafana
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
EOF

    success "Grafana deployed"
}

# Function to deploy monitoring stack using docker-compose
deploy_monitoring_stack() {
    info "Deploying monitoring stack using Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Start monitoring stack
    docker-compose -f monitoring/docker-compose.monitoring.yml up -d
    
    # Wait for services to be ready
    info "Waiting for monitoring services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f monitoring/docker-compose.monitoring.yml ps | grep -q "Up"; then
        success "Monitoring stack deployed successfully"
    else
        error "Failed to deploy monitoring stack"
        return 1
    fi
}

# Function to create monitoring ingress
create_ingress() {
    info "Creating ingress for monitoring services..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-ingress
  namespace: ganggpt-monitoring
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: grafana.ganggpt.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
    - host: prometheus.ganggpt.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
EOF

    success "Monitoring ingress created"
}

# Function to display monitoring URLs
display_urls() {
    info "Monitoring services deployed successfully!"
    echo ""
    success "Access your monitoring dashboards:"
    echo "  Grafana:    http://grafana.ganggpt.local (admin/admin123)"
    echo "  Prometheus: http://prometheus.ganggpt.local"
    echo ""
    warn "Don't forget to add the following to your /etc/hosts file:"
    echo "  127.0.0.1 grafana.ganggpt.local"
    echo "  127.0.0.1 prometheus.ganggpt.local"
    echo ""
    info "For port-forwarding access (if ingress is not available):"
    echo "  kubectl port-forward -n ganggpt-monitoring svc/grafana 3000:3000"
    echo "  kubectl port-forward -n ganggpt-monitoring svc/prometheus 9090:9090"
}

# Function to setup alerting
setup_alerting() {
    info "Setting up alerting..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: ganggpt-monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
        - name: alertmanager
          image: prom/alertmanager:v0.25.0
          ports:
            - containerPort: 9093
          volumeMounts:
            - name: alertmanager-config
              mountPath: /etc/alertmanager/
          resources:
            requests:
              memory: "128Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "100m"
      volumes:
        - name: alertmanager-config
          configMap:
            name: alertmanager-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: ganggpt-monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'localhost:587'
      smtp_from: 'alerts@ganggpt.com'
    
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
    
    receivers:
      - name: 'web.hook'
        webhook_configs:
          - url: 'http://localhost:5001/'
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: ganggpt-monitoring
spec:
  selector:
    app: alertmanager
  ports:
    - port: 9093
      targetPort: 9093
  type: ClusterIP
EOF

    success "Alerting configured"
}

# Function to run health checks
health_check() {
    info "Running health checks..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$MONITORING_NAMESPACE" &> /dev/null; then
        error "Monitoring namespace does not exist"
        return 1
    fi
    
    # Check if pods are running
    local running_pods=$(kubectl get pods -n "$MONITORING_NAMESPACE" --field-selector=status.phase=Running --no-headers | wc -l)
    info "Running pods in monitoring namespace: $running_pods"
    
    # Check if services are accessible
    kubectl get svc -n "$MONITORING_NAMESPACE"
    
    success "Health check completed"
}

# Function to cleanup monitoring stack
cleanup() {
    warn "Cleaning up monitoring stack..."
    
    # Delete Kubernetes resources
    kubectl delete namespace "$MONITORING_NAMESPACE" --ignore-not-found=true
    
    # Stop Docker Compose services
    cd "$PROJECT_ROOT"
    docker-compose -f monitoring/docker-compose.monitoring.yml down -v
    
    success "Monitoring stack cleaned up"
}

# Function to display usage
usage() {
    cat << EOF
GangGPT Monitoring Setup Script

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    deploy              Deploy complete monitoring stack
    deploy-k8s          Deploy Kubernetes monitoring only
    deploy-docker       Deploy Docker Compose monitoring only
    cleanup             Remove all monitoring components
    health              Run health checks
    urls                Display monitoring service URLs

OPTIONS:
    --namespace NS      Monitoring namespace [default: ganggpt-monitoring]
    --admin-password P  Grafana admin password [default: admin123]

EXAMPLES:
    $0 deploy
    $0 deploy-k8s --namespace monitoring
    $0 cleanup

EOF
}

# Main function
main() {
    local command="${1:-deploy}"
    shift || true
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                MONITORING_NAMESPACE="$2"
                shift 2
                ;;
            --admin-password)
                GRAFANA_ADMIN_PASSWORD="$2"
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
        deploy)
            check_prerequisites
            create_namespace
            deploy_prometheus
            deploy_grafana
            setup_alerting
            create_ingress
            deploy_monitoring_stack
            display_urls
            ;;
        deploy-k8s)
            check_prerequisites
            create_namespace
            deploy_prometheus
            deploy_grafana
            setup_alerting
            create_ingress
            display_urls
            ;;
        deploy-docker)
            check_prerequisites
            deploy_monitoring_stack
            ;;
        cleanup)
            cleanup
            ;;
        health)
            health_check
            ;;
        urls)
            display_urls
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
