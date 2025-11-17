const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const productsRouter = require('./routes/products');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/products', productsRouter);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Not Found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal Server Error' });
});

module.exports = app;
