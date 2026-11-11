# KijaniKiosk Capstone: Track A (Infrastructure-First)

## What is this?
This repository contains a production-approaching deployment pipeline for the `kk-payments` service. It includes a fully reproducible staging environment, automated CI/CD with an approval gate, and AI governance documentation.

## Architecture
The system consists of a `kijani-staging` namespace provisioned by Terraform, configured by Ansible, and deployed to via a Jenkins pipeline. See `docs/architecture.png` for the full diagram.

## Prerequisites
Before running the setup, ensure you have the following installed:
- Terraform (>= 1.0)
- Ansible (>= 2.9) and the `kubernetes.core` collection
- Minikube and kubectl
- Jenkins (optional, for running the pipeline)
- Docker

## Setup
To reproduce this system from scratch:
1. Start the local cluster: `minikube start`
2. Provision infrastructure: `cd terraform && terraform init && terraform apply -auto-approve`
3. Configure environment: `cd ../ansible && ansible-playbook playbook.yml`
4. Apply Kubernetes manifests: `cd .. && kubectl apply -f k8s/ -n kijani-staging`

## How to run the pipeline
If using Jenkins, create a new pipeline job pointing to this repository. The `Jenkinsfile` will automatically:
1. Deploy to staging.
2. Run a smoke test.
3. Wait for manual approval.
4. Deploy to production.

## How to verify it works
- Check the namespace: `kubectl get ns kijani-staging`
- Check the deployment: `kubectl get deployments -n kijani-staging`
- Check pods are running: `kubectl get pods -n kijani-staging`
- Verify the service endpoint: `kubectl get svc -n kijani-staging`

## Known Limitations
- **Not Production Ready:** This uses a local Minikube cluster and an `nginx:alpine` image instead of a real `kk-payments` build.
- **No real Database:** The ConfigMap uses a dummy `staging-db.kijani.local` host.
- **Manual Approval:** The Jenkins pipeline requires a manual click to promote to production.
- **Secrets:** Secrets are not managed via Vault or a Secret Manager in this iteration.
