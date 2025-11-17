import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const SOURCES = ['amazon', 'bestbuy', 'walmart'];
const PRODUCTS = [
  'asus-rog-zephyrus-g16',
  'lenovo-legion-5-pro',
  'acer-predator-helios-300',
  'msi-raider-ge78',
  'alienware-m16',
  'hp-omen-16'
];

function buildReviews(productId) {
  const base = PRODUCTS.indexOf(productId);
  if (base === -1) return [];
  const pattern = [5, 4, 5, 3, 4, 2, 5, 4, 3];
  const titles = [
    'Great performance', 'Solid value', 'Thermals could be better',
    'Excellent display', 'Battery life ok', 'Build quality is sturdy'
  ];
  const out = [];
  let rid = 1;
  for (const source of SOURCES) {
    for (let i = 0; i < 4; i++) {
      const rating = pattern[(base + i) % pattern.length];
      out.push({
        source,
        review_id: `${productId}-${source}-${rid++}`,
        author: `user${1000 + base * 10 + i}`,
        rating,
        title: titles[(base + i) % titles.length],
        body: `Review for ${productId} on ${source}. Overall rating ${rating} stars.`,
        created_at: new Date(Date.now() - (i + base) * 86400000).toISOString()
      });
    }
  }
  return out;
}

app.get('/scrape/all/:productId', (req, res) => {
  const { productId } = req.params;
  const data = buildReviews(productId);
  res.json(data);
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Mock scraper running on :${PORT}`);
});
