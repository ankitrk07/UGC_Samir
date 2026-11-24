import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export default function Icon() { return new ImageResponse(<div style={{display:'flex',width:64,height:64,alignItems:'center',justifyContent:'center',background:'#07070A',borderRadius:14}}><svg width="43" height="43" viewBox="0 0 40 40"><path d="m20 2 15.6 9v18L20 38 4.4 29V11Z" fill="none" stroke="#C6FF00" strokeWidth="3"/><path d="m20 11 7.8 4.5v9L20 29l-7.8-4.5v-9Z" fill="#C6FF00"/></svg></div>,size); }
