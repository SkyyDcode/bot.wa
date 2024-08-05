module.exports = {
    apps: [
      {
        name: 'SkyyBot',
        script: './index.js',
        watch: true,
        max_memory_restart: '300M',
        env: {
          NODE_ENV: 'development',
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  