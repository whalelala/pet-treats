export function upsertCartItem(cartItems, product, quantity = 1) {
  const amount = Math.max(1, Number(quantity) || 1);
  const existing = cartItems.find((item) => item.productId === product.id);

  if (!existing) {
    return [
      ...cartItems,
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: amount
      }
    ];
  }

  return cartItems.map((item) =>
    item.productId === product.id ? { ...item, quantity: item.quantity + amount } : item
  );
}

export function setCartQuantity(cartItems, productId, quantity) {
  const amount = Number(quantity);

  if (!Number.isInteger(amount) || amount < 1) {
    return removeCartItem(cartItems, productId);
  }

  return cartItems.map((item) =>
    item.productId === productId ? { ...item, quantity: amount } : item
  );
}

export function removeCartItem(cartItems, productId) {
  return cartItems.filter((item) => item.productId !== productId);
}

export function calculateCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function validateCheckout(customer, cartItems) {
  const errors = [];

  if (!String(customer.name || '').trim()) {
    errors.push('请输入收货人姓名');
  }

  if (!String(customer.phone || '').trim()) {
    errors.push('请输入联系电话或微信号');
  }

  if (!String(customer.address || '').trim()) {
    errors.push('请输入收货地址');
  }

  if (cartItems.length === 0) {
    errors.push('购物车不能为空');
  }

  return errors;
}
