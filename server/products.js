export const categories = [
  { id: 'training', label: '训练奖励' },
  { id: 'freeze-dried', label: '冻干肉类' },
  { id: 'dental', label: '洁齿零食' },
  { id: 'low-allergy', label: '低敏配方' },
  { id: 'puppy', label: '幼犬适用' }
];

export const products = [
  {
    id: 'training-duck-bites',
    name: '鸭肉训练奖励粒',
    category: 'training',
    categoryLabel: '训练奖励',
    price: 46,
    size: '120g',
    hero: '小颗粒好掰开，适合日常训练和外出奖励。',
    ingredients: ['鸭胸肉', '南瓜粉', '燕麦纤维'],
    suitableFor: ['成犬', '小型犬', '训练期'],
    tags: ['低脂', '小颗粒', '不粘手'],
    imageTone: 'sage',
    image: '/assets/product-training-duck-bites.png'
  },
  {
    id: 'freeze-dried-chicken',
    name: '冻干鸡胸肉粒',
    category: 'freeze-dried',
    categoryLabel: '冻干肉类',
    price: 68,
    size: '90g',
    hero: '单一肉源冻干，保留鸡胸肉香气和松脆口感。',
    ingredients: ['鸡胸肉'],
    suitableFor: ['成犬', '挑食犬', '拌粮'],
    tags: ['单一肉源', '高蛋白', '可拌粮'],
    imageTone: 'oat',
    image: '/assets/product-freeze-dried-chicken.png'
  },
  {
    id: 'dental-mint-sticks',
    name: '薄荷洁齿棒',
    category: 'dental',
    categoryLabel: '洁齿零食',
    price: 52,
    size: '7支装',
    hero: '韧性咀嚼结构，帮助日常磨牙和清新口气。',
    ingredients: ['豌豆纤维', '鸡肉粉', '薄荷叶粉'],
    suitableFor: ['成犬', '中大型犬'],
    tags: ['耐咬', '清新口气', '每日洁齿'],
    imageTone: 'mint',
    image: '/assets/product-dental-mint-sticks.png'
  },
  {
    id: 'low-allergy-lamb',
    name: '低敏羊肉软条',
    category: 'low-allergy',
    categoryLabel: '低敏配方',
    price: 59,
    size: '100g',
    hero: '温和肉源和柔软口感，适合肠胃敏感狗狗。',
    ingredients: ['羊腿肉', '红薯粉', '亚麻籽'],
    suitableFor: ['敏感肠胃', '成犬', '老年犬'],
    tags: ['软条', '温和肉源', '好咀嚼'],
    imageTone: 'clay',
    image: '/assets/product-low-allergy-lamb.png'
  },
  {
    id: 'puppy-salmon-cubes',
    name: '幼犬三文鱼小方',
    category: 'puppy',
    categoryLabel: '幼犬适用',
    price: 62,
    size: '80g',
    hero: '细小软粒和鱼肉香气，适合作为幼犬启蒙奖励。',
    ingredients: ['三文鱼', '马铃薯粉', '蛋黄粉'],
    suitableFor: ['幼犬', '小型犬', '训练期'],
    tags: ['软粒', '鱼肉香', '幼犬友好'],
    imageTone: 'salmon',
    image: '/assets/product-puppy-salmon-cubes.png'
  },
  {
    id: 'beef-joint-strips',
    name: '牛肉关节营养条',
    category: 'training',
    categoryLabel: '训练奖励',
    price: 76,
    size: '110g',
    hero: '结实肉条添加软骨素，适合运动量较高的狗狗。',
    ingredients: ['牛后腿肉', '鸡软骨粉', '胡萝卜'],
    suitableFor: ['成犬', '运动犬', '中大型犬'],
    tags: ['肉条', '软骨素', '耐嚼'],
    imageTone: 'beef',
    image: '/assets/product-beef-joint-strips.png'
  }
];

export function findProduct(productId) {
  return products.find((product) => product.id === productId);
}

export function filterProducts({ category, q, minPrice, maxPrice } = {}) {
  const keyword = String(q || '').trim().toLowerCase();
  const min = Number.isFinite(Number(minPrice)) ? Number(minPrice) : null;
  const max = Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null;

  return products.filter((product) => {
    const matchesCategory = !category || category === 'all' || product.category === category;
    const haystack = [
      product.name,
      product.categoryLabel,
      product.hero,
      ...product.ingredients,
      ...product.suitableFor,
      ...product.tags
    ]
      .join(' ')
      .toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const matchesMin = min === null || product.price >= min;
    const matchesMax = max === null || product.price <= max;

    return matchesCategory && matchesKeyword && matchesMin && matchesMax;
  });
}
