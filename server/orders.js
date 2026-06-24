import { findProduct } from './products.js';

export function validateOrderPayload(payload) {
  const errors = [];
  const customer = payload?.customer || {};
  const items = Array.isArray(payload?.items) ? payload.items : [];

  if (!String(customer.name || '').trim()) {
    errors.push('请输入收货人姓名');
  }

  if (!String(customer.phone || '').trim()) {
    errors.push('请输入联系电话或微信号');
  }

  if (!String(customer.address || '').trim()) {
    errors.push('请输入收货地址');
  }

  if (items.length === 0) {
    errors.push('购物车不能为空');
  }

  for (const item of items) {
    const product = findProduct(item.productId);
    const quantity = Number(item.quantity);

    if (!product) {
      errors.push(`商品不存在：${item.productId}`);
    } else if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push(`${product.name} 的数量必须大于 0`);
    }
  }

  return errors;
}

export function createOrder(payload) {
  const lineItems = payload.items.map((item) => {
    const product = findProduct(item.productId);
    const quantity = Number(item.quantity);

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity
    };
  });
  const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: createOrderId(),
    status: 'created',
    paymentStatus: 'pending_configuration',
    customer: {
      name: payload.customer.name.trim(),
      phone: payload.customer.phone.trim(),
      address: payload.customer.address.trim()
    },
    items: lineItems,
    note: String(payload.note || '').trim(),
    total,
    createdAt: new Date().toISOString()
  };
}

function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');

  return `PP-${date}-${suffix}`;
}
