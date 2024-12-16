pipeline {
    agent any
    environment {
        GITHUB_CREDENTIALS = "8d51209e-434f-4761-bb3d-1f9e3974d0b1"

        REMOTE_USER = "ansible"
        REMOTE_IP = credentials("acide-elastika-01")
        // Folder where docker-compose and .env files are placed
        REMOTE_FOLDER = "/home/${REMOTE_USER}/docker/trazo-develop/"

        // prefix of the image to build
        SERVICE_PREFIX = "trazo-dev"
        REGISTRY_USER = "araozu"
        REGISTRY_CREDENTIALS = "f16149d3-8913-40f9-80ff-9eca92eef798"
        IMAGE_PREFIX = "${REGISTRY_USER}/${SERVICE_PREFIX}"
        ESCAPED_IMAGE_PREFIX = "${REGISTRY_USER}\\/${SERVICE_PREFIX}"

        SSH_COM = "ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_IP}"
    }

    stages {
        stage("Build & push image") {
            steps {
                sh "cp deployment/Dockerfile ."
                script {
                    withDockerRegistry(credentialsId: "${REGISTRY_CREDENTIALS}") {
                        // build docker image
                        def image = docker.build("${IMAGE_PREFIX}-api:${BUILD_NUMBER}-fix")
                        image.push()
                    }
                }
                sh "rm Dockerfile || true"
            }
        }
        stage("Restart backend service") {
            steps {
                sshagent(['ssh-deploy']) {
                    // Replace docker image version
                    sh "${SSH_COM} 'cd ${REMOTE_FOLDER} && sed -i -E \"s/image: ${ESCAPED_IMAGE_PREFIX}-api:.+\$/image: ${ESCAPED_IMAGE_PREFIX}-api:${BUILD_NUMBER}-fix/\" docker-compose.yml'"
                    sh "${SSH_COM} 'cd ${REMOTE_FOLDER} && docker compose up -d --no-deps ${SERVICE_PREFIX}-api'"
                    sh "${SSH_COM} 'cd ${REMOTE_FOLDER} && docker images -q --filter \"dangling=true\" | xargs -r docker rmi'"
                }
            }
        }
    }
}
