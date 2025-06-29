#!/bin/bash

# ========================================
# GangGPT Security Hardening Script
# Enterprise-grade security implementation
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
NAMESPACE="ganggpt-production"
SECURITY_NAMESPACE="ganggpt-security"

# Function to log messages
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

info() { log "${BLUE}[INFO]${NC} $1"; }
warn() { log "${YELLOW}[WARN]${NC} $1"; }
error() { log "${RED}[ERROR]${NC} $1"; }
success() { log "${GREEN}[SUCCESS]${NC} $1"; }

# Function to create security namespace
create_security_namespace() {
    info "Creating security namespace..."
    
    kubectl create namespace "$SECURITY_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    success "Security namespace created/updated"
}

# Function to deploy network policies
deploy_network_policies() {
    info "Deploying network policies..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ganggpt-network-policy
  namespace: ganggpt-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ganggpt-production
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  - from: []
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: ganggpt-production
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
    - protocol: UDP
      port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-default
  namespace: ganggpt-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

    success "Network policies deployed"
}

# Function to deploy Pod Security Standards
deploy_pod_security_standards() {
    info "Deploying Pod Security Standards..."
    
    # Label namespace for Pod Security Standards
    kubectl label namespace "$NAMESPACE" \
        pod-security.kubernetes.io/enforce=restricted \
        pod-security.kubernetes.io/audit=restricted \
        pod-security.kubernetes.io/warn=restricted \
        --overwrite
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: SecurityContext
metadata:
  name: ganggpt-security-context
  namespace: ganggpt-production
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001
  seccompProfile:
    type: RuntimeDefault
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
EOF

    success "Pod Security Standards deployed"
}

# Function to deploy RBAC policies
deploy_rbac_policies() {
    info "Deploying RBAC policies..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ganggpt-backend
  namespace: ganggpt-production
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ganggpt-web
  namespace: ganggpt-production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ganggpt-production
  name: ganggpt-backend-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ganggpt-production
  name: ganggpt-web-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ganggpt-backend-binding
  namespace: ganggpt-production
subjects:
- kind: ServiceAccount
  name: ganggpt-backend
  namespace: ganggpt-production
roleRef:
  kind: Role
  name: ganggpt-backend-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ganggpt-web-binding
  namespace: ganggpt-production
subjects:
- kind: ServiceAccount
  name: ganggpt-web
  namespace: ganggpt-production
roleRef:
  kind: Role
  name: ganggpt-web-role
  apiGroup: rbac.authorization.k8s.io
EOF

    success "RBAC policies deployed"
}

# Function to deploy secrets management
deploy_secrets_management() {
    info "Deploying secrets management..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: ganggpt-secrets
  namespace: ganggpt-production
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAcG9zdGdyZXNxbDo1NDMyL2dhbmdncHQ=
  redis-url: cmVkaXM6Ly9yZWRpczpAcmVkaXM6NjM3OS8w
  jwt-secret: c3VwZXItc2VjcmV0LWp3dC1rZXktZm9yLWdhbmdncHQ=
  openai-api-key: c2stWU9VUi1PUEVOQUktQVBJLUtFWS1IRVJF
---
apiVersion: v1
kind: Secret
metadata:
  name: ganggpt-tls
  namespace: ganggpt-production
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t
  tls.key: LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t
EOF

    success "Secrets management deployed"
}

# Function to deploy Falco for runtime security
deploy_falco() {
    info "Deploying Falco for runtime security monitoring..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: falco
  namespace: ganggpt-security
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: falco
rules:
- apiGroups: [""]
  resources: ["nodes", "namespaces", "pods", "replicationcontrollers", "replicasets", "services", "daemonsets", "deployments", "events", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["daemonsets", "deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["extensions"]
  resources: ["daemonsets", "deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: falco
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: falco
subjects:
- kind: ServiceAccount
  name: falco
  namespace: ganggpt-security
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-config
  namespace: ganggpt-security
data:
  falco.yaml: |
    rules_file:
      - /etc/falco/falco_rules.yaml
      - /etc/falco/ganggpt_rules.yaml
    time_format_iso_8601: true
    json_output: true
    json_include_output_property: true
    log_stderr: true
    log_syslog: false
    log_level: info
    outputs:
      rate: 1
      max_burst: 1000
    syslog_output:
      enabled: false
    file_output:
      enabled: true
      keep_alive: false
      filename: /var/log/falco/events.log
    stdout_output:
      enabled: true
    webserver:
      enabled: true
      listen_port: 8765
      ssl_enabled: false
    grpc:
      enabled: false
    grpc_output:
      enabled: false

  ganggpt_rules.yaml: |
    - rule: Unauthorized Process in GangGPT Container
      desc: Detect unauthorized processes in GangGPT containers
      condition: >
        spawned_process and
        container and
        k8s.ns.name = "ganggpt-production" and
        not proc.name in (node, npm, pnpm, sh, bash)
      output: >
        Unauthorized process in GangGPT container
        (user=%user.name command=%proc.cmdline container=%container.name image=%container.image.repository)
      priority: WARNING

    - rule: GangGPT File Access Outside App Directory
      desc: Detect file access outside application directory in GangGPT containers
      condition: >
        open_read and
        container and
        k8s.ns.name = "ganggpt-production" and
        not fd.name startswith "/app/" and
        not fd.name startswith "/tmp/" and
        not fd.name startswith "/var/log/"
      output: >
        File access outside app directory in GangGPT
        (user=%user.name file=%fd.name container=%container.name image=%container.image.repository)
      priority: WARNING

    - rule: GangGPT Network Connection to Suspicious Port
      desc: Detect network connections to suspicious ports from GangGPT containers
      condition: >
        outbound and
        container and
        k8s.ns.name = "ganggpt-production" and
        fd.sport_l not in (80, 443, 5432, 6379, 53, 22)
      output: >
        Suspicious network connection from GangGPT
        (user=%user.name connection=%fd.name container=%container.name image=%container.image.repository)
      priority: WARNING
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: falco
  namespace: ganggpt-security
spec:
  selector:
    matchLabels:
      app: falco
  template:
    metadata:
      labels:
        app: falco
    spec:
      serviceAccountName: falco
      hostNetwork: true
      hostPID: true
      containers:
      - name: falco
        image: falcosecurity/falco:0.35.0
        securityContext:
          privileged: true
        resources:
          limits:
            memory: 512Mi
            cpu: 200m
          requests:
            memory: 256Mi
            cpu: 100m
        volumeMounts:
        - mountPath: /var/run/docker.sock
          name: docker-socket
          readOnly: true
        - mountPath: /dev
          name: dev-fs
          readOnly: true
        - mountPath: /proc
          name: proc-fs
          readOnly: true
        - mountPath: /boot
          name: boot-fs
          readOnly: true
        - mountPath: /lib/modules
          name: lib-modules
          readOnly: true
        - mountPath: /usr
          name: usr-fs
          readOnly: true
        - mountPath: /etc/falco
          name: falco-config
        - mountPath: /var/log/falco
          name: falco-logs
      volumes:
      - name: docker-socket
        hostPath:
          path: /var/run/docker.sock
      - name: dev-fs
        hostPath:
          path: /dev
      - name: proc-fs
        hostPath:
          path: /proc
      - name: boot-fs
        hostPath:
          path: /boot
      - name: lib-modules
        hostPath:
          path: /lib/modules
      - name: usr-fs
        hostPath:
          path: /usr
      - name: falco-config
        configMap:
          name: falco-config
      - name: falco-logs
        emptyDir: {}
EOF

    success "Falco runtime security deployed"
}

# Function to deploy security scanning
deploy_security_scanning() {
    info "Deploying security scanning tools..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-scan
  namespace: ganggpt-security
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: trivy
            image: aquasec/trivy:latest
            command:
            - sh
            - -c
            - |
              trivy image --format json --output /tmp/scan-results.json ghcr.io/dragoscv/gang-gpt-gta-v/backend:latest
              trivy image --format json --output /tmp/scan-results-web.json ghcr.io/dragoscv/gang-gpt-gta-v/web:latest
              echo "Security scan completed"
            volumeMounts:
            - name: scan-results
              mountPath: /tmp
          volumes:
          - name: scan-results
            emptyDir: {}
          restartPolicy: OnFailure
EOF

    success "Security scanning deployed"
}

# Function to enable admission controllers
enable_admission_controllers() {
    info "Configuring admission controllers..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionWebhook
metadata:
  name: ganggpt-security-webhook
webhooks:
- name: security.ganggpt.com
  clientConfig:
    service:
      name: ganggpt-security-webhook
      namespace: ganggpt-security
      path: "/validate"
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  admissionReviewVersions: ["v1", "v1beta1"]
  sideEffects: None
  failurePolicy: Fail
  namespaceSelector:
    matchLabels:
      security-policy: "enforced"
EOF

    success "Admission controllers configured"
}

# Function to setup resource quotas
setup_resource_quotas() {
    info "Setting up resource quotas..."
    
    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ganggpt-quota
  namespace: ganggpt-production
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
    services: "10"
    secrets: "20"
    configmaps: "20"
    pods: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: ganggpt-limits
  namespace: ganggpt-production
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
  - max:
      cpu: "2"
      memory: "2Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
    type: Container
EOF

    success "Resource quotas configured"
}

# Function to audit security configuration
audit_security() {
    info "Running security audit..."
    
    echo ""
    info "Checking network policies..."
    kubectl get networkpolicies -n "$NAMESPACE"
    
    echo ""
    info "Checking RBAC configuration..."
    kubectl get roles,rolebindings -n "$NAMESPACE"
    
    echo ""
    info "Checking pod security..."
    kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext}{"\n"}{end}'
    
    echo ""
    info "Checking resource quotas..."
    kubectl describe quota -n "$NAMESPACE"
    
    echo ""
    info "Checking secrets..."
    kubectl get secrets -n "$NAMESPACE"
    
    success "Security audit completed"
}

# Function to generate security report
generate_security_report() {
    info "Generating security report..."
    
    local report_file="security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "GangGPT Security Report"
        echo "Generated: $(date)"
        echo "=========================="
        echo ""
        
        echo "Network Policies:"
        kubectl get networkpolicies -n "$NAMESPACE" --no-headers
        echo ""
        
        echo "RBAC Configuration:"
        kubectl get roles,rolebindings -n "$NAMESPACE" --no-headers
        echo ""
        
        echo "Pod Security Context:"
        kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext}{"\n"}{end}'
        echo ""
        
        echo "Resource Quotas:"
        kubectl describe quota -n "$NAMESPACE"
        echo ""
        
        echo "Security Monitoring:"
        kubectl get pods -n "$SECURITY_NAMESPACE" --no-headers
        echo ""
        
    } > "$report_file"
    
    success "Security report generated: $report_file"
}

# Function to display usage
usage() {
    cat << EOF
GangGPT Security Hardening Script

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    deploy              Deploy complete security stack
    network             Deploy network policies only
    rbac                Deploy RBAC policies only
    secrets             Deploy secrets management only
    monitoring          Deploy security monitoring only
    audit               Run security audit
    report              Generate security report
    cleanup             Remove security configurations

OPTIONS:
    --namespace NS      Production namespace [default: ganggpt-production]
    --security-ns NS    Security namespace [default: ganggpt-security]

EXAMPLES:
    $0 deploy
    $0 audit
    $0 report

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
                NAMESPACE="$2"
                shift 2
                ;;
            --security-ns)
                SECURITY_NAMESPACE="$2"
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
            create_security_namespace
            deploy_network_policies
            deploy_pod_security_standards
            deploy_rbac_policies
            deploy_secrets_management
            deploy_falco
            deploy_security_scanning
            enable_admission_controllers
            setup_resource_quotas
            success "Complete security hardening deployed"
            ;;
        network)
            deploy_network_policies
            ;;
        rbac)
            deploy_rbac_policies
            ;;
        secrets)
            deploy_secrets_management
            ;;
        monitoring)
            create_security_namespace
            deploy_falco
            deploy_security_scanning
            ;;
        audit)
            audit_security
            ;;
        report)
            generate_security_report
            ;;
        cleanup)
            kubectl delete namespace "$SECURITY_NAMESPACE" --ignore-not-found=true
            warn "Security configurations cleaned up"
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
