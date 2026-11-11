pipeline {
    agent any
    
    environment {
        STAGING_NS = "kijani-staging"
        PROD_NS = "default"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                echo 'Deploying to Staging Environment...'
                sh 'kubectl apply -f k8s/kk-payments-configmap.yaml -n ${STAGING_NS}'
                sh 'kubectl apply -f k8s/kk-payments-deployment.yaml -n ${STAGING_NS}'
                sh 'kubectl apply -f k8s/kk-payments-service.yaml -n ${STAGING_NS}'
                sh 'kubectl rollout status deployment/kk-payments -n ${STAGING_NS}'
            }
        }
        
        stage('Staging Smoke Test') {
            steps {
                echo 'Running smoke test against staging...'
                sh 'kubectl run curl-test --image=curlimages/curl -i --rm --restart=Never -- curl -s http://kk-payments.${STAGING_NS}.svc.cluster.local'
            }
        }
        
        stage('Approval Gate') {
            steps {
                input message: 'Staging smoke test passed. Deploy to Production?', ok: 'Deploy to Prod'
            }
        }
        
        stage('Deploy to Production') {
            steps {
                echo 'Deploying to Production Environment...'
                sh 'kubectl apply -f k8s/kk-payments-deployment.yaml -n ${PROD_NS}'
                sh 'kubectl apply -f k8s/kk-payments-service.yaml -n ${PROD_NS}'
                sh 'kubectl rollout status deployment/kk-payments -n ${PROD_NS}'
            }
        }
    }
}
