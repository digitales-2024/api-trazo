pipeline {
    agent any
    environment {
        GITHUB_CREDENTIALS = "8d51209e-434f-4761-bb3d-1f9e3974d0b1"
        BACKEND_URL = "git@github.com:digitales-2024/api-trazo.git"
        FRONTEND_URL = ""
        REMOTE_IP = ""
        REMOTE_CREDENTIALS = ""
    }

    stages {
        stage("Build & deploy backend") {
            steps {
                dir("backend") {
                    script {
                        // get source code & store info
                        def scm_vars = checkout scmGit(
                            branches: [[name: 'refs/heads/develop']],
                            userRemoteConfigs: [[
                                credentialsId: "${GITHUB_CREDENTIALS}",
                                url: "${BACKEND_URL}"
                            ]]
                        )

                        if (scm_vars.GIT_COMMIT == scm_vars.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
                            echo "Backend already built"
                        } else {
                            // build docker image
                            sh "docker build . -t ${JOB_NAME}:${BUILD_NUMBER}"

                            // upload image to registry
                            // TODO

                            // Enter remote env, restart service
                            // Replace docker image version
                            // TODO
                        }
                    }
                }
            }
        }
        stage("Restart backend service") {
            steps {
                dir("/services/acide-trazo") {
                    // Enter deploy env, restart service
                    sh 'docker-compose down || true'
                    // Replace docker image version
                    sh "sed -i -E \"s/image: acide-api-trazo-develop:.+\$/image: acide-api-trazo-develop:${BUILD_NUMBER}/\" docker-compose.yml"
                    sh 'docker-compose up -d'
                }
            }
        }
    }
}

