module.exports = {
  apps: [
    {
      name: 'app',
      script: './app.js',
      instances: 1,
      autorestart: true,
      watch: false,
//      max_memory_restart: '1G',
    },
    {
      name: 'worker',
      script: './worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
//      max_memory_restart: '1G',
    },
//    {
//      name: 'docker-compose-app',
//      script: 'docker-compose up -d',
//      args: './docker-compose.yml',
//      watch: false,
//      autorestart: true
//    }
  ]
};
