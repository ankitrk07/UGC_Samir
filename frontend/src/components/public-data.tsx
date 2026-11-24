'use client';
import { createContext,useContext,useEffect,useState } from 'react';
import { api } from '@/lib/api';
import type { Asset } from '@/config/assets';
export type PublicPlan={plan:string;name:string;monthly:number;annual:number;currency:string;features:string[]};
export type PublicStory={id:string;type:string;quote:string;tag:string;initials:string;color:string;metric:string;label:string};
type PublicData={media:Asset[];pricing:PublicPlan[];faq:{id:string;question:string;answer:string}[];testimonials:PublicStory[];stats?:{creators:number;views:number;posts:number;countries:number}};
const Context=createContext<PublicData>({media:[],pricing:[],faq:[],testimonials:[]});
export const usePublicData=()=>useContext(Context);
export function PublicDataProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<PublicData>({media:[],pricing:[],faq:[],testimonials:[]});
 useEffect(()=>{const ctrl=new AbortController();void Promise.allSettled(['media/showcase','pricing','faq','testimonials','stats'].map(path=>api(path,{signal:ctrl.signal}))).then(results=>{if(ctrl.signal.aborted)return;setData({media:results[0]?.status==='fulfilled'?results[0].value as Asset[]:[],pricing:results[1]?.status==='fulfilled'?results[1].value as PublicPlan[]:[],faq:results[2]?.status==='fulfilled'?results[2].value as PublicData['faq']:[],testimonials:results[3]?.status==='fulfilled'?results[3].value as PublicStory[]:[],stats:results[4]?.status==='fulfilled'?results[4].value as PublicData['stats']:undefined});});return()=>ctrl.abort();},[]);
 return <Context.Provider value={data}>{children}</Context.Provider>;
}
