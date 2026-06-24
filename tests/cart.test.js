import { describe, expect, it } from 'vitest';
import {
  calculateCartTotal,
  removeCartItem,
  setCartQuantity,
  upsertCartItem,
  validateCheckout
} from '../src/lib/cart.js';

const products = [
  { id: 'training-duck-bites', name: '鸭肉训练奖励粒', price: 46 },
  { id: 'dental-mint-sticks', name: '薄荷洁齿棒', price: 52 }
];

describe('cart helpers', () => {
  it('adds products and merges quantities for repeated items', () => {
    const first = upsertCartItem([], products[0], 1);
    const second = upsertCartItem(first, products[0], 2);

    expect(second).toEqual([
      {
        productId: 'training-duck-bites',
        name: '鸭肉训练奖励粒',
        price: 46,
        quantity: 3
      }
    ]);
  });

  it('updates, removes, and totals cart items', () => {
    const cart = [
      { productId: 'training-duck-bites', name: '鸭肉训练奖励粒', price: 46, quantity: 2 },
      { productId: 'dental-mint-sticks', name: '薄荷洁齿棒', price: 52, quantity: 1 }
    ];

    const adjusted = setCartQuantity(cart, 'training-duck-bites', 1);
    const withoutDental = removeCartItem(adjusted, 'dental-mint-sticks');

    expect(calculateCartTotal(withoutDental)).toBe(46);
  });
});

describe('checkout validation', () => {
  it('returns Chinese validation messages for missing customer fields and empty cart', () => {
    expect(validateCheckout({ name: '', phone: '', address: '' }, [])).toEqual([
      '请输入收货人姓名',
      '请输入联系电话或微信号',
      '请输入收货地址',
      '购物车不能为空'
    ]);
  });
});
