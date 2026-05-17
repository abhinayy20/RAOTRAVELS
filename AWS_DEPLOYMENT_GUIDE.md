# RAO Travels — AWS EC2 Production Deployment Guide

This guide details the step-by-step procedure to deploy the RAO Travels application on real **AWS Cloud Infrastructure (EC2)** using **Docker**, **Nginx**, and **GitHub Actions CI/CD**.

---

## 🛠️ System Architecture

```mermaid
graph LR
    A[GitHub Actions CI/CD] -->|Push Docker Images| B[Docker Hub]
    A -->|Trigger Deploy via SSH| C[AWS EC2 Instance]
    C -->|Pulls Images| B
    C -->|Runs Containers| D[Nginx Reverse Proxy]
    D -->|HTTPS Port 443| E[Frontend Container]
    D -->|API Port 5000| F[Backend Container]
    F -->|Database Operations| G[MongoDB Atlas Cloud]
```

---

## 📋 Prerequisites
1. An active **AWS Account**.
2. A **Docker Hub** account.
3. Access to your GitHub repository settings.
4. A custom domain (optional, for SSL Certbot configuration).

---

## 🚀 Step 1: Launch AWS EC2 Instance

1. Navigate to the **AWS EC2 Console** and click **Launch Instance**.
2. **Name:** `rao-travels-prod`
3. **AMI:** `Ubuntu Server 24.04 LTS` (64-bit x86).
4. **Instance Type:** `t3.medium` (recommended) or `t2.micro` (free-tier eligible).
5. **Key Pair:** Create a new key pair `rao-key.pem` and download it safely.
6. **Network Settings (Security Groups):**
   * Allow **SSH** (Port 22) — Restrict to your IP for high security.
   * Allow **HTTP** (Port 80) — Anywhere.
   * Allow **HTTPS** (Port 443) — Anywhere.

---

## 📦 Step 2: Install Docker on EC2

Connect to your EC2 instance via SSH:
```bash
ssh -i rao-key.pem ubuntu@your-ec2-public-ip
```

Run the following commands to install Docker & Docker Compose:
```bash
# Update local packages
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io

# Start and enable Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# Allow ubuntu user to execute docker commands without sudo
sudo usermod -aG docker ubuntu

# Log out and log back in to apply group membership
exit
ssh -i rao-key.pem ubuntu@your-ec2-public-ip

# Install Docker Compose (V2)
sudo apt-get install -y docker-compose-v2
```

Verify your installation:
```bash
docker --version
docker compose version
```

---

## 🔑 Step 3: Clone Code & Configure Secrets

Clone the repository directly on your EC2 instance:
```bash
git clone https://github.com/abhinayy20/RAOTRAVELS.git
cd RAOTRAVELS
```

Create the production environment file:
```bash
nano .env.prod
```

Paste the following variables (replacing them with your real credentials):
```env
DOCKER_USERNAME=your_dockerhub_username
MONGO_URI=mongodb+srv://raotravels_user:your_password@cluster0.your_hash.mongodb.net/raotravels
JWT_SECRET=rao_travels_super_secure_key_2026
OPENAI_API_KEY=sk-proj-your_openai_api_key
NODE_ENV=production
PORT=5000
```
*Save the file by pressing `Ctrl+O`, `Enter`, and exit with `Ctrl+X`.*

---

## 🛡️ Step 4: Configure Nginx & SSL Certbot

1. Open [nginx.prod.conf](file:///c:/Users/ASUS/RAOTRAVELS/nginx.prod.conf) and replace `yourdomain.com` with your real custom domain or your EC2 Public DNS (if not using SSL).
2. If using SSL, generate a Let's Encrypt SSL certificate:
```bash
sudo apt-get install certbot -y
# Run certbot to verify your domain ownership and pull certificates
sudo certbot certonly --webroot -w ./certbot/www -d yourdomain.com
```

If you do NOT have a custom domain yet, you can modify `nginx.prod.conf` to serve on HTTP (Port 80) directly using the EC2 Public IP!

---

## ⚡ Step 5: Start the Platform Manually

Verify that everything boots correctly:
```bash
# Run the deployment helper script
chmod +x deploy.sh
./deploy.sh
```

Check the active containers:
```bash
docker ps
```

Your services are now fully operational!
*   **Frontend UI:** `http://your-ec2-public-ip/`
*   **Backend Server:** `http://your-ec2-public-ip/api/`

---

## 🔄 Step 6: Configure GitHub Actions CI/CD (Continuous Deployment)

To automate deployments every time you push to `master`:

1. In your GitHub Repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Create the following **Repository Secrets**:
   * `DOCKER_USERNAME`: Your Docker Hub username.
   * `DOCKER_PASSWORD`: Your Docker Hub password.
   * `EC2_SSH_KEY`: The complete text inside your downloaded `rao-key.pem` private key.
   * `EC2_HOST`: Your EC2 Instance Public IP.
   * `EC2_USER`: `ubuntu`

### Add CD Step to `.github/workflows/ci-cd.yml`

Our pipeline is configured to automatically connect to your EC2 instance via SSH, pull the newly compiled images from Docker Hub, and execute `./deploy.sh` to update the site with **Zero Downtime**!

---

## 📊 Step 7: Monitoring with Prometheus & Grafana

To monitor system load, container health, and request rate metrics in real-time, spin up the monitoring stack:

```bash
# Start Prometheus and Grafana container metrics monitoring
docker compose -f docker-compose.prod.yml -f docker-compose.security.yml up -d
```
*   **Grafana Dashboard:** Accessible at `http://your-ec2-public-ip:3000` (Default: `admin` / `admin`).
