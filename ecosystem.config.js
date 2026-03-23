module.exports = {
  apps: [
    {
      name: 'attendance-api',
      script: 'dist/src/main.js',
      instances: 1, // Ubah ke 'max' jika ingin menggunakan semua CPU core
      exec_mode: 'fork', // Ubah ke 'cluster' jika instances > 1
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        // Tambahkan variabel environment production lainnya di sini jika perlu
        // PORT: 3000,
      },
    },
  ],
};
