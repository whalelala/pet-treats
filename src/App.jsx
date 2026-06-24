import { useEffect, useMemo, useState } from 'react';
import {
  calculateCartTotal,
  removeCartItem,
  setCartQuantity,
  upsertCartItem,
  validateCheckout
} from './lib/cart.js';
import { categories as fallbackCategories, products as fallbackProducts } from '../server/products.js';

const canUseApi =
  typeof window === 'undefined' || !window.location.hostname.endsWith('github.io');

function resolveAssetPath(path) {
  if (!path || !path.startsWith('/')) {
    return path;
  }

  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}

function createStaticOrder({ total }) {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');

  return {
    id: `PP-${datePart}-LOCAL`,
    total,
    paymentStatus: 'pending_configuration',
    status: 'created'
  };
}

const paymentProviders = [
  { id: 'wechat', label: '微信支付' },
  { id: 'alipay', label: '支付宝' }
];

export default function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(fallbackProducts[0] || null);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [loading, setLoading] = useState(canUseApi);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!canUseApi) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setProducts(data.products);
        setCategories(data.categories);
        setSelectedProduct(data.products[0] || null);
      })
      .catch(() => {
        if (isMounted) {
          setProducts(fallbackProducts);
          setCategories(fallbackCategories);
          setSelectedProduct(fallbackProducts[0] || null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const haystack = [product.name, product.hero, product.categoryLabel, ...product.tags]
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [activeCategory, products, query]);

  const total = calculateCartTotal(cartItems);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function handleAddToCart(product) {
    setCartItems((current) => upsertCartItem(current, product, 1));
    setSelectedProduct(product);
    setPaymentMessage('');
  }

  async function handleSubmitOrder(event) {
    event.preventDefault();
    const validationErrors = validateCheckout(customer, cartItems);

    setErrors(validationErrors);
    setPaymentMessage('');

    if (validationErrors.length > 0) {
      return;
    }

    if (!canUseApi) {
      setCreatedOrder(createStaticOrder({ total }));
      setErrors([]);
      return;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        note
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setErrors(data.errors || ['订单提交失败，请检查信息后重试']);
      return;
    }

    setCreatedOrder(data.order);
    setErrors([]);
  }

  async function handlePayment(provider) {
    if (!createdOrder) {
      return;
    }

    if (!canUseApi) {
      setPaymentMessage('微信/支付宝支付暂未开通，请联系客服完成支付。');
      return;
    }

    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: createdOrder.id, provider })
    });
    const data = await response.json();

    setPaymentMessage(data.message || '支付暂未开通，请联系客服完成支付。');
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Paw Pantry 首页">
          <span className="brand-mark" aria-hidden="true">
            <svg className="brand-icon" viewBox="0 0 64 64" role="img">
              <path className="brand-symbol-bag" d="M20 25h24l-2.4 23H22.4L20 25Z" />
              <path className="brand-symbol-lip" d="M23 25c4.8 2.2 13.2 2.2 18 0" />
              <path className="brand-symbol-handle" d="M24.5 25c.8-6.4 3.9-9.5 7.5-9.5s6.7 3.1 7.5 9.5" />
              <circle className="brand-symbol-dot" cx="32" cy="37" r="4.2" />
            </svg>
          </span>
          <span>Paw Pantry</span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <a href="#products">商品</a>
          <a href="#checkout">结算</a>
          <a href="#care">安心标准</a>
        </nav>
        <a className="cart-link" href="#cart">
          购物车 · {cartCount} 件
        </a>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <h1>给橘白小朋友的天然零食柜</h1>
            <p>
              以家里这只爱晒太阳的狗狗作为主角，挑选训练、陪伴和日常奖励都适合的小食。
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#products">
                选购零食
              </a>
              <a className="secondary-action" href="#cart">
                查看购物车
              </a>
            </div>
            <dl className="proof-row" aria-label="商品承诺">
              <div>
                <dt>5 类</dt>
                <dd>日常喂养场景</dd>
              </div>
              <div>
                <dt>0</dt>
                <dd>人工色素</dd>
              </div>
              <div>
                <dt>24h</dt>
                <dd>订单确认</dd>
              </div>
            </dl>
          </div>
          <div className="hero-media" aria-label="Paw Pantry 狗狗主视觉">
            <img src={resolveAssetPath('/assets/hero-dog-studio-v2.png')} alt="以橘白狗狗为主体二创的天然零食主视觉" />
          </div>
        </section>

        <section className="catalog-section" id="products">
          <div className="section-heading">
            <h2>按狗狗日常场景挑选</h2>
            <p>从训练、洁齿到敏感肠胃，先用少量多次的方式观察适口性。</p>
          </div>

          <div className="catalog-tools" aria-label="商品筛选">
            <div className="category-tabs">
              <button
                className={activeCategory === 'all' ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveCategory('all')}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  className={activeCategory === category.id ? 'is-active' : ''}
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <label className="search-field">
              <span>搜索</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="鸡胸、洁齿、幼犬"
              />
            </label>
          </div>

          {loading ? <p className="state-message">正在加载商品...</p> : null}
          {apiError ? <p className="state-message error">{apiError}</p> : null}

          <div className="shop-grid">
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
            <aside className="detail-panel" aria-label="商品详情">
              {selectedProduct ? <ProductDetail product={selectedProduct} /> : null}
            </aside>
          </div>
        </section>

        <section className="checkout-grid" id="checkout">
          <CartPanel
            cartItems={cartItems}
            total={total}
            onChangeQuantity={(productId, quantity) =>
              setCartItems((current) => setCartQuantity(current, productId, quantity))
            }
            onRemove={(productId) => setCartItems((current) => removeCartItem(current, productId))}
          />
          <CheckoutPanel
            customer={customer}
            createdOrder={createdOrder}
            errors={errors}
            note={note}
            paymentMessage={paymentMessage}
            total={total}
            onChangeCustomer={setCustomer}
            onChangeNote={setNote}
            onPay={handlePayment}
            onSubmit={handleSubmitOrder}
          />
        </section>

        <section className="care-section" id="care">
          <h2>安心标准</h2>
          <div className="care-list">
            <p>清楚标注主原料和适用狗狗阶段，不用夸大功效代替喂养判断。</p>
            <p>建议新零食先少量试喂，观察 24 小时，再作为日常奖励加入训练。</p>
            <p>支付接口已预留，商户资料配置前不会伪装成真实在线收款。</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProductCard({ product, onAddToCart, onSelect }) {
  return (
    <article className="product-card">
      <button className="product-visual product-photo" type="button" onClick={() => onSelect(product)} aria-label={`查看${product.name}`}>
        <img src={resolveAssetPath(product.image || '/assets/product-training-duck-bites.png')} alt={`${product.name} 产品摄影`} />
        <span>{product.categoryLabel}</span>
      </button>
      <div className="product-copy">
        <h3>{product.name}</h3>
        <p>{product.hero}</p>
        <div className="product-meta">
          <span>{product.size}</span>
          <strong>¥{product.price}</strong>
        </div>
      </div>
      <button className="add-button" type="button" onClick={() => onAddToCart(product)}>
        加入购物车
      </button>
    </article>
  );
}

function ProductDetail({ product }) {
  return (
    <div>
      <p className="panel-label">当前查看</p>
      <h2>{product.name}</h2>
      <p>{product.hero}</p>
      <div className="detail-group">
        <span>主原料</span>
        <p>{product.ingredients.join(' / ')}</p>
      </div>
      <div className="detail-group">
        <span>适用</span>
        <p>{product.suitableFor.join(' / ')}</p>
      </div>
      <div className="tag-row">
        {product.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function CartPanel({ cartItems, total, onChangeQuantity, onRemove }) {
  return (
    <section className="panel" id="cart" aria-label="购物车">
      <div className="panel-heading">
        <p className="panel-label">购物车</p>
        <h2>确认零食清单</h2>
      </div>
      {cartItems.length === 0 ? (
        <p className="empty-state">购物车还没有商品，先从上方挑选一款训练奖励。</p>
      ) : (
        <ul className="cart-list">
          {cartItems.map((item) => (
            <li key={item.productId}>
              <div>
                <strong>{item.name}</strong>
                <span>¥{item.price} / 件</span>
              </div>
              <input
                aria-label={`${item.name} 数量`}
                min="1"
                type="number"
                value={item.quantity}
                onChange={(event) => onChangeQuantity(item.productId, Number(event.target.value))}
              />
              <button type="button" onClick={() => onRemove(item.productId)}>
                移除
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="cart-total">合计 ¥{total}</p>
    </section>
  );
}

function CheckoutPanel({
  customer,
  createdOrder,
  errors,
  note,
  paymentMessage,
  total,
  onChangeCustomer,
  onChangeNote,
  onPay,
  onSubmit
}) {
  return (
    <section className="panel" aria-label="结算">
      <div className="panel-heading">
        <p className="panel-label">结算</p>
        <h2>提交收货信息</h2>
      </div>
      <form className="checkout-form" onSubmit={onSubmit}>
        <label>
          收货人
          <input
            value={customer.name}
            onChange={(event) => onChangeCustomer({ ...customer, name: event.target.value })}
          />
        </label>
        <label>
          电话或微信
          <input
            value={customer.phone}
            onChange={(event) => onChangeCustomer({ ...customer, phone: event.target.value })}
          />
        </label>
        <label>
          收货地址
          <textarea
            value={customer.address}
            onChange={(event) => onChangeCustomer({ ...customer, address: event.target.value })}
          />
        </label>
        <label>
          备注
          <textarea value={note} onChange={(event) => onChangeNote(event.target.value)} />
        </label>
        {errors.length > 0 ? (
          <div className="form-errors" role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <button className="primary-action form-submit" type="submit">
          提交订单
        </button>
      </form>

      {createdOrder ? (
        <div className="order-result">
          <h3>订单 {createdOrder.id} 已创建</h3>
          <p>订单金额 ¥{createdOrder.total || total}，支付状态：待配置商户资料。</p>
          <div className="payment-actions">
            {paymentProviders.map((provider) => (
              <button key={provider.id} type="button" onClick={() => onPay(provider.id)}>
                {provider.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {paymentMessage ? <p className="payment-message">{paymentMessage}</p> : null}
    </section>
  );
}
