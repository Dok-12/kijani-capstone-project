# Operations Runbook: kk-payments

## 1. How to check the health of the system

Check staging pods:

```bash
kubectl get pods -n kijani-staging
```

All application pods should show `Running` with `1/1` ready.

Check the deployment:

```bash
kubectl rollout status deployment/kk-payments -n kijani-staging
```

## 2. How to deploy a new version

Merge changes to the `main` branch.

The Jenkins pipeline automatically:
- Builds and tests the application.
- Builds and pushes the Docker image.
- Deploys the new version to staging.
- Runs staging smoke tests.
- Waits for manual approval before production deployment.

Production must not be deployed without approval.

## 3. How to rollback a bad deployment

If a bad image is deployed to staging, run:

```bash
kubectl rollout undo deployment/kk-payments -n kijani-staging
```

Check the rollback:

```bash
kubectl rollout status deployment/kk-payments -n kijani-staging
```

## 4. Where to find logs

Application logs:

```bash
kubectl logs -l app=kk-payments -n kijani-staging
```

Follow logs continuously:

```bash
kubectl logs -l app=kk-payments -n kijani-staging -f
```

Prometheus logs:

```bash
kubectl logs deployment/prometheus -n monitoring
```

## 5. Monitoring with Prometheus

Prometheus monitors the `kk-payments` application in the staging namespace.

It discovers application pods through Kubernetes service discovery and scrapes their `/metrics` endpoints every 15 seconds.

### Access the Prometheus dashboard

Start port forwarding:

```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

Open the following address in a browser:

`http://localhost:9090`

### Check application targets

Open:

`http://localhost:9090/targets`

Both staging payment pods should show as `UP`.

Alternatively, run this PromQL query:

```promql
up{job="kk-payments"}
```

A value of `1` means the target is reachable.

### Inspect payment request metrics

Use:

```promql
http_requests_total{job="kk-payments"}
```

This displays HTTP request counters grouped by pod, method, route and response status.

### Inspect the high-error-rate alert

Open:

`http://localhost:9090/alerts`

The alert is named `KijaniPaymentsHighErrorRate`.

It is configured to fire when the HTTP 5xx error rate exceeds 5% for at least two minutes.

An `inactive` state means the alert condition is not currently met. It does not indicate a monitoring failure.

### Troubleshooting

If a target is down:

1. Check that staging pods are running:
   ```bash
   kubectl get pods -n kijani-staging
   ```
2. Check application logs:
   ```bash
   kubectl logs -l app=kk-payments -n kijani-staging
   ```
3. Check Prometheus logs:
   ```bash
   kubectl logs deployment/prometheus -n monitoring
   ```
4. Check target status at `http://localhost:9090/targets`.

If Prometheus is not running:

```bash
kubectl get pods -n monitoring
kubectl describe deployment prometheus -n monitoring
```
