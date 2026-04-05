import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  const [{ default: app }, { default: connectDB }] = await Promise.all([
    import('./app.js'),
    import('./config/db.js'),
  ]);

  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();
