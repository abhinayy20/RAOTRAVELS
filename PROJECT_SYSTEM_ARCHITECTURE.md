# RAO Travels — Comprehensive System Architecture & Engineering Blueprints

This blueprint details the **System Architecture**, **CI/CD Pipeline**, and **Multi-Tier Security Hardening** implemented across the RAO Travels platform for academic/project evaluation.

---

## 🏛️ 1. Overall System Architecture

The application is engineered as a highly scalable microservice system utilizing a containerized structure proxy-passed through Nginx.

```mermaid
graph TD
    User[Client Browser] -->|HTTPS Port 443 / HTTP 80| Nginx[Production Nginx Gateway]
    
    subgraph Containerized Application Environment
        Nginx -->|Proxy: Static Assets / UI| FE[Frontend Container: Nginx Alpine]
        Nginx -->|Proxy: /api/* Routing| BE[Backend Container: Node.js Express]
        
        BE -->|JWT Verification & Chat| AI[GPT-4o Mini AI Engine]
        BE -->|Scrape Metrics| Prometheus[Prometheus Container]
        Prometheus -->|Data Visualization| Grafana[Grafana Container]
    end
    
    subgraph Data Tier
        BE -->|Mongoose connection| DB[(MongoDB Atlas Cloud)]
    end
```

---

## 🔄 2. DevSecOps CI/CD Pipeline

Our automated build-and-test workflow, configured inside `.github/workflows/ci-cd.yml`, integrates strict linting, security scanning, and deployment stages on push to `master`.

```mermaid
graph TD
    Push[Code Push to master] --> Checkout[Step 1: Code Checkout]
    Checkout --> Gitleaks[Step 2: Gitleaks Secrets Scan]
    Checkout --> Sonar[Step 3: SonarQube Code Quality]
    Checkout --> Hadolint[Step 4: Hadolint Dockerfile Linter]
    Checkout --> Checkov[Step 5: Checkov K8s Manifest Linter]
    
    Gitleaks & Sonar & Hadolint & Checkov -->|All Pass| Build[Step 6: Docker Build & Tag]
    
    Build --> Trivy[Step 7: Trivy Container Vulnerability Scan]
    
    Trivy -->|All Clean| PushHub[Step 8: Push to Docker Hub]
    
    PushHub --> Deploy[Step 9: SSH Trigger EC2/AKS Zero-Downtime deploy]
```

---

## 🛡️ 3. Multi-Tier Security Hardening

To ensure enterprise-grade security and prevent malicious exploits, the system applies safety layers at the Application, Container, and Network scopes:

```mermaid
mindmap
  root((Hardening Controls))
    Application Security
      Helmet headers
      Rate Limiting
      Mongo Sanitize
      Strict CORS Origin Limits
      JSON Payload Limit 10kb
    Container Security
      Hadolint analysis
      Trivy vulnerabilities scans
      Minimal base images alpine
      Non-root execution
    Deployment Security
      Gitleaks Secrets Scan
      Kubernetes Secrets Enveloping
      Checkov K8s validations
      Ingress TLS Termination
```

---

## 📸 4. Project Validation Guides

Here is where to capture screenshots for your evaluation deck:

### 🐳 A. Docker & Container Verification
Run the following command locally or on your EC2 instance to demonstrate active containers:
```bash
docker ps
```
*Expected screenshot elements:* Three active containers (`rao-travels-frontend`, `rao-travels-backend`, `rao-travels-proxy`) running on ports 80, 5000, and 443 respectively.

### ☸️ B. Kubernetes Cluster Status
Run these commands inside your local Minikube or AKS cloud cluster:
```bash
kubectl get all -n rao-travels
kubectl get ingress -n rao-travels
```
*Expected screenshot elements:* Displaying two active replica sets (frontend & backend), matching ClusterIP services, and the active Ingress route holding host mapping values.

### 📈 C. Real-Time Telemetry & Monitoring
Load your Prometheus dashboard to confirm active target metrics scrapers:
```bash
http://your-ec2-public-ip:9090/targets
```
*Expected screenshot elements:* Active endpoints for both `rao-backend` and `rao-frontend` showing status `UP`.
