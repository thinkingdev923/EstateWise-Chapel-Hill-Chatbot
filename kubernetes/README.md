# Kubernetes Manifests

![Kubernetes](https://img.shields.io/badge/Kubernetes-Cluster-blue?logo=kubernetes) ![Kustomize](https://img.shields.io/badge/Kustomize-Config-blue?logo=kustomize) ![Consul](https://img.shields.io/badge/Consul-ServiceMesh-blue?logo=hashicorp-consul)

Workloads live under `kubernetes/base` (Kustomize) with optional overlays per environment. These manifests assume the Consul Connect injector is active (HashiCorp stack) and that secrets are provisioned separately. See [DEPLOYMENTS.md](../DEPLOYMENTS.md) for how this fits alongside the AWS/Azure/GCP options.

## Structure

```
kubernetes/
├─ base/
│  ├─ backend-deployment.yaml
│  ├─ backend-service.yaml
│  ├─ configmap.yaml
│  ├─ frontend-deployment.yaml
│  ├─ frontend-service.yaml
│  ├─ ingress.yaml
│  ├─ kustomization.yaml
│  └─ namespace.yaml
└─ overlays/
   └─ prod/
      └─ kustomization.yaml
```

## Usage

```bash
# Apply the base (dev / staging)
kubectl apply -k kubernetes/base

# Apply production overlay (custom domain, autoscaling, etc.)
kubectl apply -k kubernetes/overlays/prod
```

Before applying, create the required secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: estatewise-secrets
  namespace: estatewise
stringData:
  mongoUri: "mongodb+srv://..."
  googleAiApiKey: "..."
  pineconeApiKey: "..."
  pineconeIndex: "estatewise-index"
  jwtSecret: "super-secret"
```

## Consul Integration

Annotations on the Deployments (`consul.hashicorp.com/connect-service`) ensure sidecars are injected. If you disable Consul, remove those annotations or set `consul.hashicorp.com/connect-inject: "false"` at the namespace level.

## Overlays

Add new overlays under `kubernetes/overlays/<name>` with a `kustomization.yaml` referencing `../base` and applying patches (HPA, pod anti-affinity, domain changes). The sample `prod` overlay includes a placeholder `patchesStrategicMerge` file – customize as needed.
