pipeline {
  agent any
  tools { nodejs 'node-22' }

  stages {
    stage('Checkout') {
      steps {
        // Checkout with PAT
        git(
          url: 'https://github.com/harshbajani/GujaratStore.git',
          credentialsId: 'github-pat',
          branch: 'main'
        )
        script {
          echo "Checked out code!"
        }
      }
    }
    stage('Lint') {
      steps {
        echo "Running linter..."
        sh 'npm install'
        sh 'npm run lint'
      }
    }
    stage('Build') {
      steps {
        echo "Building the application..."
        sh 'npm run build'
      }
    }
  }
}
