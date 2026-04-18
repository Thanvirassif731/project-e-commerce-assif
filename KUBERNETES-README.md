# Kubernetes Deployment Guide (Step-by-Step)

This guide deploys the MERN e-commerce app to Kubernetes with:

- `client` (React + Vite static build served by Nginx)
- `server` (Node.js + Express API)
- external MongoDB (recommended: MongoDB Atlas)
- Ingress routing (`/` to client, `/api` to server)

## 1. Prerequisites

Install and verify:

- Docker
- kubectl
- Kubernetes cluster (minikube, kind, Docker Desktop Kubernetes, EKS, GKE, AKS)
- Ingress controller (for local: NGINX Ingress)

Verify tools:

```powershell
kubectl version --client
kubectl cluster-info
docker --version
```

If local cluster with minikube:

```powershell
minikube start
minikube addons enable ingress
```

## 2. Create Dockerfiles

Your repo currently does not include Dockerfiles, so create both files below.

### 2.1 Create `server/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### 2.2 Create `client/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set this to your public API base URL during build.
# Example: https://shop.example.com/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```
cd server
docker build -t mern-ecom-server:1.0.0 .

cd ../client
docker build --build-arg VITE_API_URL=http://localhost:5000/api -t mern-ecom-client:1.0.0 .
```

### 2.3 (Optional but recommended) Create `.dockerignore` files

Create `server/.dockerignore`:

```text
node_modules
npm-debug.log
.env
```

Create `client/.dockerignore`:

```text
node_modules
dist
npm-debug.log
.env
```

## 3. Build and Push Container Images

Choose your registry namespace (Docker Hub example):

- `<REGISTRY_USER>/mern-ecom-server:1.0.0`
- `<REGISTRY_USER>/mern-ecom-client:1.0.0`

Build:

```powershell
cd server
docker build -t <REGISTRY_USER>/mern-ecom-server:1.0.0 .

cd ..\client
docker build --build-arg VITE_API_URL=https://shop.example.com/api -t <REGISTRY_USER>/mern-ecom-client:1.0.0 .

cd ..
```

Push:

```powershell
docker push <REGISTRY_USER>/mern-ecom-server:1.0.0
docker push <REGISTRY_USER>/mern-ecom-client:1.0.0
```

## 4. Create Kubernetes Namespace

```powershell
kubectl create namespace mern-ecom
```

## 5. Create Secrets and Config

Use MongoDB Atlas connection string for production.

### 5.1 Create app secrets

```powershell
kubectl -n mern-ecom create secret generic mern-ecom-secrets `
  --from-literal=MONGO_URI="<YOUR_MONGO_URI>" `
  --from-literal=JWT_SECRET="<YOUR_JWT_SECRET>" `
  --from-literal=ADMIN_NAME="Admin User" `
  --from-literal=ADMIN_EMAIL="admin@example.com" `
  --from-literal=ADMIN_PASSWORD="Admin1234" `
  --from-literal=AWS_S3_REGION="<AWS_REGION>" `
  --from-literal=AWS_S3_BUCKET_NAME="<S3_BUCKET_NAME>" `
  --from-literal=AWS_ACCESS_KEY_ID="<AWS_ACCESS_KEY_ID>" `
  --from-literal=AWS_SECRET_ACCESS_KEY="<AWS_SECRET_ACCESS_KEY>" `
  --from-literal=AWS_S3_PUBLIC_BASE_URL=""
```

### 5.2 Create config map

```powershell
kubectl -n mern-ecom create configmap mern-ecom-config `
  --from-literal=PORT="5000" `
  --from-literal=NODE_ENV="production" `
  --from-literal=CLIENT_URL="https://shop.example.com"
```

## 6. Create Kubernetes Manifests

Create folder `k8s/` at repo root and add files below.

### 6.1 `k8s/server-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mern-ecom-server
  namespace: mern-ecom
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mern-ecom-server
  template:
    metadata:
      labels:
        app: mern-ecom-server
    spec:
      containers:
        - name: server
          image: <REGISTRY_USER>/mern-ecom-server:1.0.0
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: mern-ecom-config
            - secretRef:
                name: mern-ecom-secrets
          readinessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: mern-ecom-server
  namespace: mern-ecom
spec:
  selector:
    app: mern-ecom-server
  ports:
    - port: 5000
      targetPort: 5000
```

### 6.2 `k8s/client-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mern-ecom-client
  namespace: mern-ecom
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mern-ecom-client
  template:
    metadata:
      labels:
        app: mern-ecom-client
    spec:
      containers:
        - name: client
          image: <REGISTRY_USER>/mern-ecom-client:1.0.0
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: mern-ecom-client
  namespace: mern-ecom
spec:
  selector:
    app: mern-ecom-client
  ports:
    - port: 80
      targetPort: 80
```

### 6.3 `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mern-ecom-ingress
  namespace: mern-ecom
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: mern-ecom-server
                port:
                  number: 5000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: mern-ecom-client
                port:
                  number: 80
```

## 7. Deploy to Kubernetes

```powershell
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

Check rollout:

```powershell
kubectl -n mern-ecom get pods
kubectl -n mern-ecom get svc
kubectl -n mern-ecom get ingress
kubectl -n mern-ecom rollout status deploy/mern-ecom-server
kubectl -n mern-ecom rollout status deploy/mern-ecom-client
```

## 8. Configure DNS

Point `shop.example.com` to your ingress public IP/hostname.

Get ingress address:

```powershell
kubectl -n mern-ecom get ingress mern-ecom-ingress
```

For local testing (without DNS), add hosts entry:

```text
<INGRESS_IP> shop.example.com
```

## 9. Verify Application

- Open `https://shop.example.com`
- Test API health: `https://shop.example.com/api/health`
- Test admin login
- Test S3 image upload
- Test checkout and coupon validation
- Test profile page and purchase history

## 10. Update / Redeploy

When you change code:

1. Build new images with a new tag.
2. Push images.
3. Update image tags in manifests.
4. Apply manifests again.

```powershell
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
```

## 11. Production Hardening Checklist

- Use strong secrets for `JWT_SECRET`, admin password, and AWS credentials.
- Use TLS (cert-manager + Let’s Encrypt or cloud load balancer certificates).
- Add resource requests/limits to both deployments.
- Restrict CORS `CLIENT_URL` to your domain.
- Use external managed MongoDB and backups.
- Consider HorizontalPodAutoscaler for API deployment.
- Rotate AWS keys and use IAM roles where possible.

## 12. Troubleshooting

View logs:

```powershell
kubectl -n mern-ecom logs deploy/mern-ecom-server --tail=200
kubectl -n mern-ecom logs deploy/mern-ecom-client --tail=200
```

Describe failing pod:

```powershell
kubectl -n mern-ecom describe pod <POD_NAME>
```

Common issues:

- `ImagePullBackOff`: wrong image tag or private registry auth missing.
- API 500 on upload: missing/invalid S3 env vars or bucket policy issue.
- Frontend cannot reach API: wrong `VITE_API_URL` at build time or ingress path mismatch.
- CORS errors: `CLIENT_URL` does not match deployed frontend domain.
