jest.mock('../../src/core/db', () => ({ db: {}, cached: jest.fn() }));
import { summarize } from '../../src/modules/analytics/service';
describe('analytics math', () => {
    const base = { date: new Date('2026-11-01T00:00:00Z'), views: 1000, likes: 50, comments: 20, shares: 10, reach: 800, revenueMinor: 30000, spendMinor: 10000, creatorId: 'c1', platform: 'Instagram', country: 'India' };
    test('aggregate ratios use summed numerators and denominators', () => { const r = summarize([base, { ...base, views: 3000, likes: 100, comments: 30, shares: 10, creatorId: 'c2' }], base.date, new Date('2026-11-03T23:59:59Z')); expect(r.totalViews).toBe(4000); expect(r.engagement).toBe(5.5); expect(r.roi).toBe(3); expect(r.cpv).toBe(.05); expect(r.activeCreators).toBe(2); expect(r.series).toHaveLength(3); expect(r.series[0]?.views).toBe(4); expect(r.series[1]?.views).toBe(0); expect(r.platforms).toEqual([{ platform: 'Instagram', views: 4000 }]); });
    test('zero spend and empty data never produce NaN or Infinity', () => { const r = summarize([], base.date, base.date); expect(r.totalViews).toBe(0); expect(r.engagement).toBe(0); expect(r.roi).toBe(0); expect(r.cpv).toBe(0); expect(r.series).toHaveLength(1); });
});
