import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { Order, Product, User } from '@/server/models';
import { serializeOrder } from './orders';
import { toId } from '@/server/utils';

const DAY = 24 * 60 * 60 * 1000;

export async function getDashboardStats() {
  await connectToDatabase();
  // Day buckets are UTC to match $dateToString.
  const since = new Date(Date.now() - 13 * DAY);
  since.setUTCHours(0, 0, 0, 0);

  const [revenueRows, statusRows, customers, productTotals, recent, daily, topProducts, attention] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avg: { $avg: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer' }),
    Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] } },
        },
      },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Product.aggregate([
      { $addFields: { totalStock: { $sum: '$variants.stock' } } },
      { $match: { $or: [{ totalStock: { $lte: storeConfig.lowStockThreshold } }, { status: 'draft' }] } },
      { $sort: { totalStock: 1 } },
      { $limit: 8 },
      { $project: { name: 1, images: 1, status: 1, totalStock: 1 } },
    ]),
  ]);

  const totals = revenueRows[0] ?? { revenue: 0, orders: 0, avg: 0 };
  const statusCounts = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
  const dailyByDate = new Map(daily.map((row) => [row._id, row]));
  const series = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(since.getTime() + index * DAY);
    const key = date.toISOString().slice(0, 10);
    return { date: key, revenue: dailyByDate.get(key)?.revenue ?? 0, orders: dailyByDate.get(key)?.orders ?? 0 };
  });

  return {
    revenue: totals.revenue,
    orderCount: statusRows.reduce((sum, row) => sum + row.count, 0),
    averageOrder: Math.round(totals.avg ?? 0),
    pendingCount: statusCounts.pending ?? 0,
    statusCounts,
    customers,
    products: productTotals[0] ?? { total: 0, active: 0, outOfStock: 0 },
    recentOrders: recent.map(serializeOrder),
    series,
    topProducts: topProducts.map((row) => ({
      id: toId(row._id),
      name: row.name,
      image: row.image,
      quantity: row.quantity,
      revenue: row.revenue,
    })),
    attention: attention.map((doc) => ({
      id: toId(doc._id),
      name: doc.name?.en ?? '',
      image: doc.images?.[0]?.url ?? '',
      totalStock: doc.totalStock ?? 0,
      status: doc.status,
    })),
  };
}
