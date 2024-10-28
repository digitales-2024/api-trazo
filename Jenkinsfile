pipeline {
	agent {
		docker {
			image 'node:22'
			reuseNode true
		}
	}
	stages {
		stage('Install') {
			steps {
				sh 'npm i'
			}
		}
		stage('Validate lint rules') {
			steps {
				sh 'npm run lint'
			}
		}
		stage('Build project') {
			steps {
				sh 'npm run build'
			}
		}
	}
}
