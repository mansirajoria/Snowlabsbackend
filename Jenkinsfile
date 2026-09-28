pipeline {
    agent any

    environment {
        SSHUSERNAME = "ubuntu"
        SCRIPTPATH = "/home/ubuntu/projects/snowlabs/snow-labs-be"
        IP = "13.200.31.195"
    }

    stages{
        stage('Build Deploy') {
            steps{
              sshagent (credentials: ['antino-new']) {
                sh "ssh -o StrictHostKeyChecking=no ${SSHUSERNAME}@${IP} 'cd ${SCRIPTPATH} && bash -x deploy.sh 2>&1'"
              }
            }
        }
    }

}
