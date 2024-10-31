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
				sh 'npx prisma generate dev'
			}
		}
		stage('Validate lint rules') {
			steps {
				sh 'DEBUG=eslint:cli-engine npm run lint'
			}
		}
		stage('Build project') {
			steps {
				sh 'npm run build'
			}
		}
	}
}
