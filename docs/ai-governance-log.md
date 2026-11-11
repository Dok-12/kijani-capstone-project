# AI Governance Log

## Entry 1
1. **Date:** 2026-11-11
2. **Tool used:** ChatGPT
3. **Task description:** Generate Terraform code for a staging namespace.
4. **What was provided to the AI:** Prompt: "Write Terraform code to create a Kubernetes namespace called kijani-staging."
5. **What the AI produced:** A `kubernetes_namespace` resource block.
6. **What it got right:** The syntax was correct and it included basic metadata.
7. **What it got wrong:** It used the deprecated `kubernetes_namespace` resource instead of `kubernetes_namespace_v1`. It also omitted environment labels.
8. **What you changed before applying the output:** I updated the resource to `kubernetes_namespace_v1` and added the `environment = "staging"` and `managed_by = "terraform"` labels to satisfy the 6-point governance checklist (Naming/Tagging).

## Entry 2
1. **Date:** 2026-11-11
2. **Tool used:** Claude
3. **Task description:** Generate a Jenkins pipeline stage for a Kubernetes rollout.
4. **What was provided to the AI:** Prompt: "Write a Jenkins pipeline step to deploy a k8s manifest to a namespace."
5. **What the AI produced:** `sh 'kubectl apply -f k8s/deployment.yaml -n kijani-staging'`
6. **What it got right:** Correct `kubectl` command syntax.
7. **What it got wrong:** It did not include a rollout status check, meaning the pipeline would pass even if the pods failed to start.
8. **What you changed before applying the output:** Added `sh 'kubectl rollout status deployment/kk-payments -n kijani-staging'` immediately after the apply step to ensure the pipeline fails if the deployment stalls.
