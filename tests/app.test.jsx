import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';

const apiProducts = {
  categories: [
    { id: 'training', label: '训练奖励' },
    { id: 'freeze-dried', label: '冻干肉类' },
    { id: 'dental', label: '洁齿零食' }
  ],
  products: [
    {
      id: 'training-duck-bites',
      name: '鸭肉训练奖励粒',
      category: 'training',
      categoryLabel: '训练奖励',
      price: 46,
      size: '120g',
      hero: '小颗粒好掰开，适合日常训练和外出奖励。',
      ingredients: ['鸭胸肉', '南瓜粉'],
      suitableFor: ['成犬', '训练期'],
      tags: ['低脂', '小颗粒'],
      imageTone: 'sage'
    },
    {
      id: 'dental-mint-sticks',
      name: '薄荷洁齿棒',
      category: 'dental',
      categoryLabel: '洁齿零食',
      price: 52,
      size: '7支装',
      hero: '韧性咀嚼结构，帮助日常磨牙和清新口气。',
      ingredients: ['豌豆纤维'],
      suitableFor: ['成犬'],
      tags: ['耐咬'],
      imageTone: 'mint'
    }
  ]
};

describe('Paw Pantry storefront', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url, options = {}) => {
      if (url === '/api/products') {
        return Promise.resolve(jsonResponse(apiProducts));
      }

      if (url === '/api/orders') {
        return Promise.resolve(
          jsonResponse(
            {
              order: {
                id: 'PP-20260624-AB12',
                total: 46,
                paymentStatus: 'pending_configuration'
              }
            },
            { status: 201 }
          )
        );
      }

      if (url === '/api/payments/create') {
        return Promise.resolve(
          jsonResponse(
            {
              code: 'payment_not_configured',
              provider: JSON.parse(options.body).provider,
              message: '微信/支付宝支付暂未开通，请联系客服完成支付。'
            },
            { status: 200 }
          )
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows products and adds one item to the cart', async () => {
    render(<App />);

    expect(screen.getByAltText('以橘白狗狗为主体二创的天然零食主视觉')).toBeInTheDocument();
    expect(await screen.findAllByText('鸭肉训练奖励粒')).not.toHaveLength(0);
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0]);

    expect(screen.getByText('购物车 · 1 件')).toBeInTheDocument();
    expect(screen.getByText('合计 ¥46')).toBeInTheDocument();
  });

  it('renders fallback products when the API is unavailable', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('API unavailable')));

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelectorAll('.product-card')).toHaveLength(6);
    });
  });

  it('validates checkout fields before order submission', async () => {
    render(<App />);

    await screen.findAllByText('鸭肉训练奖励粒');
    fireEvent.click(screen.getByRole('button', { name: '提交订单' }));

    expect(screen.getByText('请输入收货人姓名')).toBeInTheDocument();
    expect(screen.getByText('购物车不能为空')).toBeInTheDocument();
  });

  it('creates an order and shows the payment placeholder message', async () => {
    render(<App />);

    expect(await screen.findAllByText('鸭肉训练奖励粒')).not.toHaveLength(0);
    fireEvent.click(screen.getAllByRole('button', { name: '加入购物车' })[0]);
    fireEvent.change(screen.getByLabelText('收货人'), { target: { value: '李女士' } });
    fireEvent.change(screen.getByLabelText('电话或微信'), { target: { value: '13800000000' } });
    fireEvent.change(screen.getByLabelText('收货地址'), {
      target: { value: '上海市徐汇区宠物街 88 号' }
    });
    fireEvent.click(screen.getByRole('button', { name: '提交订单' }));

    expect(await screen.findByText('订单 PP-20260624-AB12 已创建')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '微信支付' }));

    await waitFor(() => {
      expect(screen.getByText('微信/支付宝支付暂未开通，请联系客服完成支付。')).toBeInTheDocument();
    });
  });
});

function jsonResponse(body, init = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status || 200,
    json: () => Promise.resolve(body)
  };
}
