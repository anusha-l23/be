module.exports = {
    apps: [
      {
        name: "smarketify-be",
        script: "npm",
        args: "run start",
        watch: false,
        instance_var: "INSTANCE_ID",
        env_production: {
          FACEBOOK_APP_ID: '2814916611978149',
          FACEBOOK_APP_SECRET:'45d2b1dcc0b1e5c7328a2bf48c29ec82',
          secret: "smarketify",
          FACEBOOK_V:"v16.0",
          FACEBOOK_CALL_BACK_URL: 'https://api.smarketify.ai/users/auth/facebook/callback',
          API_URL='https://api.smarketify.ai',
          EMAIL_USER='contact@smarketify.ai',
          EMAIL_PASSWORD='Smarketify@987'
        },
        env_staging: {
        },
      },
    ],
    deploy: {
      production: {
        user: "ubuntu",
        key: "~/.ssh/private-keys/smarketify.pem",
        host: ["18.218.199.190"],
        repo: "https://github.com/flytekart/smarketify-node-be.git",
        ref: "origin/master",
        path: "/home/ubuntu/smarketify",
        ssh_options: "StrictHostKeyChecking=no",
        "post-deploy":
          "npm ci && pm2 startOrRestart ecosystem.config.js --env production",
        env: {
          NODE_ENV: "production",
        },
      },
      staging: {

      },
    },
  };
  