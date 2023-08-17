## Deployment steps

1. Make sure to push everything to the master branch. Because, the live version is running on the master branch.
2. Run the below command
     `pm2 deploy ecosystem.config.js production`


**Note:** Please make sure to have smarketify.pem file in the below location. 
    `~/.ssh/private-keys/smarketify.pem`
