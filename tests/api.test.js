import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../server/app.js';

describe('product API', () => {
  it('filters products by category, keyword, and max price', async () => {
    const response = await request(app)
      .get('/api/products')
      .query({ category: 'freeze-dried', q: '鸡胸', maxPrice: '80' })
      .expect(200);

    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]).toMatchObject({
      id: 'freeze-dried-chicken',
      name: '冻干鸡胸肉粒',
      category: 'freeze-dried',
      price: 68
    });
  });

  it('returns one product by id', async () => {
    const response = await request(app)
      .get('/api/products/dental-mint-sticks')
      .expect(200);

    expect(response.body.product).toMatchObject({
      id: 'dental-mint-sticks',
      category: 'dental',
      suitableFor: expect.arrayContaining(['成犬'])
    });
  });
});

describe('order and payment API', () => {
  it('creates an order with customer and cart details', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        customer: {
          name: '李女士',
          phone: '13800000000',
          address: '上海市徐汇区宠物街 88 号'
        },
        items: [
          { productId: 'training-duck-bites', quantity: 2 },
          { productId: 'dental-mint-sticks', quantity: 1 }
        ],
        note: '周末送达'
      })
      .expect(201);

    expect(response.body.order).toMatchObject({
      status: 'created',
      paymentStatus: 'pending_configuration',
      total: 144
    });
    expect(response.body.order.id).toMatch(/^PP-\d{8}-[A-Z0-9]{4}$/);
  });

  it('returns validation errors for an incomplete order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        customer: { name: '', phone: '', address: '' },
        items: []
      })
      .expect(400);

    expect(response.body.errors).toEqual([
      '请输入收货人姓名',
      '请输入联系电话或微信号',
      '请输入收货地址',
      '购物车不能为空'
    ]);
  });

  it('reports payment_not_configured for WeChat and Alipay placeholders', async () => {
    const response = await request(app)
      .post('/api/payments/create')
      .send({ orderId: 'PP-20260624-AB12', provider: 'wechat' })
      .expect(200);

    expect(response.body).toMatchObject({
      code: 'payment_not_configured',
      provider: 'wechat',
      message: '微信/支付宝支付暂未开通，请联系客服完成支付。'
    });
  });
});
