import type { components } from './generated/api';
const seriesAnchors = [
  { day: '01', views: 18, engagement: 4.2, roi: 1.2 }, { day: '05', views: 31, engagement: 4.9, roi: 1.8 }, { day: '10', views: 27, engagement: 4.6, roi: 1.7 }, { day: '15', views: 62, engagement: 6.2, roi: 2.9 }, { day: '20', views: 48, engagement: 5.7, roi: 2.6 }, { day: '25', views: 87, engagement: 7.8, roi: 4.2 }, { day: '30', views: 124, engagement: 8.4, roi: 5.6 },
];
export const campaignData = Array.from({length:30},(_,i)=>{const position=i/29*(seriesAnchors.length-1);const a=seriesAnchors[Math.floor(position)],b=seriesAnchors[Math.min(Math.ceil(position),seriesAnchors.length-1)];const t=position-Math.floor(position);return {day:String(i+1).padStart(2,'0'),views:Number((a.views+(b.views-a.views)*t).toFixed(1)),engagement:Number((a.engagement+(b.engagement-a.engagement)*t).toFixed(1)),roi:Number((a.roi+(b.roi-a.roi)*t).toFixed(2))};});
export const mockCampaigns = [
  { id: 'TH-001', name: 'The everyday edit', category: 'Lifestyle', status: 'Live', creators: 84, views: 1240000, budget: 2400 },
  { id: 'TH-002', name: 'A little less ordinary', category: 'Beauty', status: 'Live', creators: 52, views: 862000, budget: 1800 },
  { id: 'TH-003', name: 'Outside looks good on you', category: 'Wellness', status: 'Review', creators: 36, views: 428000, budget: 1200 },
  { id: 'TH-004', name: 'Made for the morning', category: 'Food & drink', status: 'Completed', creators: 108, views: 2300000, budget: 3200 },
] satisfies components["schemas"]["Campaign"][];
export const mockCreators = [
  { id: 'C-01', handle: '@the.everyday.edit', niche: 'Lifestyle', country: 'United Kingdom', followers: 42000, engagement: 6.8 },
  { id: 'C-02', handle: '@slowmorning.studio', niche: 'Wellness', country: 'United States', followers: 68000, engagement: 7.2 },
  { id: 'C-03', handle: '@thecitynotebook', niche: 'Fashion', country: 'India', followers: 31000, engagement: 8.1 },
  { id: 'C-04', handle: '@goodthings.daily', niche: 'Food & drink', country: 'Australia', followers: 56000, engagement: 5.9 },
];
export type Campaign = components['schemas']['Campaign'];
export type Creator = components['schemas']['Creator'];
export type Analytics = { totalViews: number; engagement: number; activeCreators: number; earnedValue: number; roi?:number; series: (typeof campaignData[number] & {date?:string})[] };
export const mockAnalytics: Analytics = { totalViews: 4830000, engagement: 8.4, activeCreators: 280, earnedValue: 34800, series: campaignData };
