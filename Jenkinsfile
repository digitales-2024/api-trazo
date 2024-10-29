pipeline {
	agent {
		docker {
			image 'node:22'
			reuseNode true
		}
	}
	options {
		timeout(time: 5, unit: 'MINUTES')
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
