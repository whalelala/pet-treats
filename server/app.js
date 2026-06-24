import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOrder, validateOrderPayload } from './orders.js';
import { categories, filterProducts, findProduct } from './products.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export const app = express();

app.use(express.json());

app.get('/api/products', (req, res) => {
  res.json({
    categories,
    products: filterProducts(req.query)
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);

  if (!product) {
    res.status(404).json({ message: '商品不存在' });
    return;
  }

  res.json({ product });
});

app.post('/api/orders', (req, res) => {
  const errors = validateOrderPayload(req.body);

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  res.status(201).json({ order: createOrder(req.body) });
});

app.post('/api/payments/create', (req, res) => {
  const provider = req.body?.provider || 'wechat';

  res.status(200).json({
    code: 'payment_not_configured',
    provider,
    message: '微信/支付宝支付暂未开通，请联系客服完成支付。'
  });
});

app.use(express.static(path.join(rootDir, 'dist')));

app.get('*splat', (req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});
