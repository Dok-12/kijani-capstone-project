
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        STAGING_NS = 'kijani-staging'
        PROD_NS = 'kijani-production'
        DOCKER_IMAGE = 'lendok/kk-payments'
        K8S_SERVER = 'https://192.168.49.2:8443'
        K8S_CA = '/var/jenkins_home/.kube/minikube-ca.crt'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm

                script {
                    env.IMAGE_TAG = env.GIT_COMMIT.take(12)
                    env.FULL_IMAGE = "${DOCKER_IMAGE}:${IMAGE_TAG}"
                }
            }
        }


        stage('Install Dependencies and Test') {
            steps {
                echo 'Installing dependencies and running tests...'

                 sh '''
            set -eu

            TEST_CONTAINER=$(docker create \
              --workdir /app \
              node:22.16.0-alpine3.22 \
              sh -c 'npm ci && npm run lint && npm test')

            docker cp app/. "$TEST_CONTAINER":/app

            set +e
            docker start -a "$TEST_CONTAINER"
            TEST_STATUS=$?
            set -e

            docker rm "$TEST_CONTAINER" >/dev/null

            exit "$TEST_STATUS"
        '''
    }
}




        stage('Build and Push Docker Image') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' ||
                    env.GIT_BRANCH == 'origin/main'
                }
            }

            steps {
                echo 'Building and publishing the payments image...'

                sh 'docker build -t "$FULL_IMAGE" .'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x

                        export DOCKER_CONFIG="$(mktemp -d)"
                        trap 'docker logout >/dev/null 2>&1 || true; rm -rf "$DOCKER_CONFIG"' EXIT

                        echo "$DOCKERHUB_TOKEN" |
                          docker login \
                            --username "$DOCKERHUB_USER" \
                            --password-stdin

                        docker push "$FULL_IMAGE"
                    '''
                }
            }
        }


        stage('Deploy to Staging') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' ||
                    env.GIT_BRANCH == 'origin/main'
                }
            }

            steps {
                echo 'Deploying the image to staging...'

                withCredentials([
                    string(
                        credentialsId: 'kubernetes-jenkins-token',
                        variable: 'K8S_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        umask 077
                        export KUBECONFIG="$(mktemp)"
                        trap 'rm -f "$KUBECONFIG"' EXIT

                        cat > "$KUBECONFIG" <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: ${K8S_CA}
    server: ${K8S_SERVER}
  name: minikube
contexts:
- context:
    cluster: minikube
    user: jenkins
    namespace: ${STAGING_NS}
  name: jenkins-context
current-context: jenkins-context
users:
- name: jenkins
  user:
    token: ${K8S_TOKEN}
EOF

                        kubectl apply \
                          -f k8s/kk-payments-deployment.yaml \
                          -n "$STAGING_NS"

                        kubectl apply \
                          -f k8s/kk-payments-service.yaml \
                          -n "$STAGING_NS"

                        kubectl set image \
                          deployment/kk-payments \
                          kk-payments="$FULL_IMAGE" \
                          -n "$STAGING_NS"

                        kubectl rollout status \
                          deployment/kk-payments \
                          -n "$STAGING_NS" \
                          --timeout=120s
                    '''
                }
            }
        }

        stage('Staging Smoke Test') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' ||
                    env.GIT_BRANCH == 'origin/main'
                }
            }

            steps {
                echo 'Testing the staging payments API...'

                withCredentials([
                    string(
                        credentialsId: 'kubernetes-jenkins-token',
                        variable: 'K8S_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        umask 077
                        export KUBECONFIG="$(mktemp)"
                        trap 'rm -f "$KUBECONFIG"' EXIT

                        cat > "$KUBECONFIG" <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: ${K8S_CA}
    server: ${K8S_SERVER}
  name: minikube
contexts:
- context:
    cluster: minikube
    user: jenkins
    namespace: ${STAGING_NS}
  name: jenkins-context
current-context: jenkins-context
users:
- name: jenkins
  user:
    token: ${K8S_TOKEN}
EOF

                        kubectl port-forward \
                          service/kk-payments 18080:80 \
                          -n "$STAGING_NS" \
                          >/tmp/kk-payments-port-forward.log 2>&1 &

                        PF_PID=$!
                        trap 'kill "$PF_PID" 2>/dev/null || true; rm -f "$KUBECONFIG"' EXIT

                        for i in $(seq 1 20); do
                            if curl -fsS http://127.0.0.1:18080/health; then
                                break
                            fi
                            sleep 2
                        done

                        curl -fsS http://127.0.0.1:18080/health

                        curl -fsS \
                          -X POST http://127.0.0.1:18080/payments \
                          -H 'Content-Type: application/json' \
                          -d '{"amount":1000,"fee":50}'
                    '''
                }
            }
        }

        stage('Production Approval') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' ||
                    env.GIT_BRANCH == 'origin/main'
                }
            }

            steps {
                input(
                    message: 'Staging smoke tests passed. Approve production deployment?',
                    ok: 'Deploy to Production'
                )
            }
        }

        stage('Deploy to Production') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' ||
                    env.GIT_BRANCH == 'origin/main'
                }
            }

            steps {
                echo 'Deploying the same tested image to production...'

                withCredentials([
                    string(
                        credentialsId: 'kubernetes-jenkins-token',
                        variable: 'K8S_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        umask 077
                        export KUBECONFIG="$(mktemp)"
                        trap 'rm -f "$KUBECONFIG"' EXIT

                        cat > "$KUBECONFIG" <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: ${K8S_CA}
    server: ${K8S_SERVER}
  name: minikube
contexts:
- context:
    cluster: minikube
    user: jenkins
    namespace: ${PROD_NS}
  name: jenkins-context
current-context: jenkins-context
users:
- name: jenkins
  user:
    token: ${K8S_TOKEN}
EOF

                        sed "s|image: kk-payments:capstone-1.0.0|image: $FULL_IMAGE|" \
                          k8s/kk-payments-deployment.yaml |
                          kubectl apply -f - -n "$PROD_NS"

                        kubectl apply \
                          -f k8s/kk-payments-service.yaml \
                          -n "$PROD_NS"

                        kubectl rollout status \
                          deployment/kk-payments \
                          -n "$PROD_NS" \
                          --timeout=120s
                    '''
                }
            }
        }
    }
}
