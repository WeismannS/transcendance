import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/pages', express.static(path.join(__dirname, 'pages')));


app.use('/src', express.static(path.join(__dirname, 'src')));

app.use('/Miku', express.static(path.join(__dirname, 'Miku')));

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Public files served from: ${path.join(__dirname, 'public')}`);
  console.log(`📁 Pages files served from: ${path.join(__dirname, 'pages')}`);
  console.log(`📁 Miku files served from: ${path.join(__dirname, 'Miku')}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`📄 All routes will serve index.html for SPA routing`);
});
