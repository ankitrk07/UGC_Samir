'use client';
import { usePublicData } from './public-data';
// Keep the existing prop contract, but never present fixture counters as live facts.
export function LiveStat({field}:{field:'creators'|'views'|'posts'|'countries';fallback:string}){const stats=usePublicData().stats;return <>{stats?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(stats[field]):'—'}</>;}
