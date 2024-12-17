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
				sh 'corepack enable'
				sh 'pnpm i'
				sh 'pnpm generate'
			}
		}
		stage('Validate lint rules') {
			steps {
				sh 'pnpm run lint'
			}
		}
		stage('Build project') {
			steps {
				sh 'pnpm run build'
			}
		}
	}
}
