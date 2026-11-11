# Operations Runbook: kk-payments

## 1. How to check the health of the system
Run: `kubectl get pods -n kijani-staging`
All pods should show `Running` with `1/1` ready.

## 2. How to deploy a new version
Merge changes to the `main` branch. The Jenkins pipeline will automatically deploy to staging and wait for manual approval before production.

## 3. How to rollback a bad deployment
If a bad image is pushed to staging, run:
`kubectl rollout undo deployment/kk-payments -n kijani-staging`

## 4. Where to find logs
`kubectl logs -l app=kk-payments -n kijani-staging`
