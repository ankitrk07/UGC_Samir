import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const alt = 'TRENDHIVE — Real people. Unreal reach.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() { return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',background:'#07070A',color:'#F3F2EC',padding:65,fontFamily:'sans-serif'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:25,letterSpacing:-1}}><span>TRENDHIVE.</span><span style={{fontSize:14,color:'#777'}}>BY ONETRENDSETTER ↗</span></div><div style={{display:'flex',flexDirection:'column',fontSize:100,fontWeight:700,letterSpacing:-7,lineHeight:1}}><span>250K creators.</span><span>Zero ad spend.</span><span style={{color:'#C6FF00',fontStyle:'italic',fontFamily:'serif'}}>Pure organic.</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:15,color:'#aaa'}}><span>GOOD PEOPLE. UNREAL REACH.</span><span style={{color:'#C6FF00'}}>START SOMETHING THAT SPREADS ↗</span></div></div>,size); }
