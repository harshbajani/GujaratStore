pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Get some code from a GitHub repository
                git 'https://github.com/harshbajani/GujaratStore.git'
                script {
                    echo "Checked out code!"
                }
            }
        }
        stage('Lint') {
            steps {
                script {
                    echo "Running linter..."
                    sh 'npm install'
                    sh 'npm run lint'
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    echo "Building the application..."
                    sh 'npm run build'
                }
            }
        }
    }
} 