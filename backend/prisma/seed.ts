import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { DateTime } from 'luxon';
import { allAssets } from '../../frontend/src/config/assets';
import { mockCampaigns,mockCreators,campaignData } from '../../frontend/src/lib/data';
const db=new PrismaClient();
async function seed(){
 if(process.env.NODE_ENV==='production')throw new Error('Demo seed is disabled in production.');
 const password=process.env.SEED_ADMIN_PASSWORD??'TrendHiveDev123!';
 const passwordHash=await argon2.hash(password);
 const admin=await db.user.upsert({where:{email:'admin@trendhive.test'},create:{id:'seed-admin',email:'admin@trendhive.test',name:'TRENDHIVE Admin',passwordHash,role:'SUPERADMIN',emailVerifiedAt:new Date()},update:{}});
 const brandUser=await db.user.upsert({where:{email:'brand@trendhive.test'},create:{id:'seed-brand',email:'brand@trendhive.test',name:'Jordan',passwordHash,role:'BRAND',emailVerifiedAt:new Date(),termsAcceptedAt:new Date(),termsVersion:'2026-11-11'},update:{}});
 const brand=await db.brandProfile.upsert({where:{userId:brandUser.id},create:{id:'seed-brand-profile',userId:brandUser.id,brand:'The Everyday Brand',website:'https://example.com',goal:'Awareness',budget:'$1,000\u2013$5,000',countries:['India','United Kingdom','United States'],platforms:['Instagram','TikTok','YouTube'],completedAt:new Date()},update:{}});
 await db.subscription.upsert({where:{id:'seed-trial'},create:{id:'seed-trial',userId:brandUser.id,trialEndsAt:new Date(Date.now()+604800000),currentPeriodEnd:new Date(Date.now()+604800000)},update:{}});
 for(const [i,c]of mockCreators.entries()){
  const user=await db.user.upsert({where:{email:'creator'+(i+1)+'@trendhive.test'},create:{id:'seed-creator-user-'+i,email:'creator'+(i+1)+'@trendhive.test',name:c.handle,passwordHash,role:'CREATOR',emailVerifiedAt:new Date()},update:{}});
  await db.creatorProfile.upsert({where:{userId:user.id},create:{id:c.id,userId:user.id,handle:c.handle,niche:c.niche,country:c.country,followers:c.followers,engagement:c.engagement,verifiedAt:new Date(),wallet:{create:{currency:'USD'}}},update:{}});
  await db.socialAccount.upsert({where:{platform_handle:{platform:'Instagram',handle:c.handle.replace(/^@/,'')}},create:{creatorId:c.id,platform:'Instagram',handle:c.handle.replace(/^@/,''),verified:true,followers:c.followers},update:{}});
 }
 for(const [i,c]of mockCampaigns.entries()){
  await db.campaign.upsert({where:{id:c.id},create:{id:c.id,brandId:brand.id,title:c.name,niche:c.category,brief:'An illustrative seeded campaign. Share an authentic everyday moment featuring this product.',budget:c.budget,status:c.status==='Live'?'LIVE':c.status==='Review'?'REVIEW':'COMPLETED',platforms:['Instagram'],countries:['India','United Kingdom','United States','Australia']},update:{}});
  for(const [j,creator]of mockCreators.entries()){
   const a=await db.application.upsert({where:{campaignId_creatorId:{campaignId:c.id,creatorId:creator.id}},create:{id:'seed-app-'+i+'-'+j,campaignId:c.id,creatorId:creator.id,status:'ACCEPTED',pitch:'I would love to tell an authentic story for this illustrative campaign.',rewardMinor:0},update:{}});
   const postId='seed-post-'+i+'-'+j;
   await db.post.upsert({where:{id:postId},create:{id:postId,campaignId:c.id,creatorId:creator.id,applicationId:a.id,platform:'Instagram',postUrl:'https://www.instagram.com/p/DEMO'+i+j+'/',status:'LIVE',latestViews:Math.floor(c.views/4)},update:{}});
   const views=Math.floor(c.views/4);await db.postMetricSnapshot.upsert({where:{id:'seed-snapshot-'+i+'-'+j},create:{id:'seed-snapshot-'+i+'-'+j,postId,views,likes:Math.floor(views*.06),comments:Math.floor(views*.01),shares:Math.floor(views*.014),reach:Math.floor(views*.8)},update:{}});
   for(const [day,p]of campaignData.entries()){const date=DateTime.utc().startOf('day').minus({days:29-day}).toJSDate();const keys={campaignId:c.id,creatorId:creator.id,platform:'Instagram',country:creator.country,date};const views=Math.round(p.views*1000/16);await db.analyticsDaily.upsert({where:{campaignId_creatorId_platform_country_date:keys},create:{...keys,brandId:brand.id,views,likes:Math.round(views*p.engagement/100*.75),comments:Math.round(views*p.engagement/100*.1),shares:Math.round(views*p.engagement/100*.15),reach:Math.round(views*.8),spendMinor:Math.round(c.budget*100/120),revenueMinor:Math.round(c.budget*100/120*p.roi)},update:{}});}
  }
 }
 const stories=[
 {quote:'We stopped asking ?how do we make an ad?? and started asking ?who would actually love this?? Everything changed.',type:'DTC SKINCARE BRAND',tag:'THE BEAUTY EDIT',metric:'2.8M',label:'ILLUSTRATIVE CAMPAIGN VIEWS',initials:'BE',color:'#FF2E93'},
 {quote:'Our best-performing content came from someone filming in their kitchen. Turns out, real life is a pretty good creative director.',type:'FOOD & DRINK BRAND',tag:'THE EVERYDAY BRAND',metric:'8.4%',label:'ILLUSTRATIVE ENGAGEMENT',initials:'EB',color:'#C6FF00'},
 {quote:'One brief. A whole library of stories we never would have thought to tell ourselves. That?s the part we keep coming back for.',type:'INDEPENDENT LIFESTYLE BRAND',tag:'THE SLOW LIVING CLUB',metric:'84',label:'ILLUSTRATIVE CREATOR PARTNERS',initials:'SL',color:'#6B4DFF'}
 ];
 for(const [i,t]of stories.entries())await db.testimonial.upsert({where:{id:'seed-story-'+i},create:{id:'seed-story-'+i,...t,order:i},update:{}});
 const faqs=[
 ['What does ?zero ad spend? actually mean?','We don?t buy media placements. Your subscription pays for the platform; creators share with their own audiences. Creator payments, product gifting and delivery costs are agreed separately.'],
 ['What happens after the free trial?','Your trial lasts seven days. You can explore the workflow without entering a credit card. A paid plan begins only when you choose to subscribe through the connected billing service.'],
 ['Can I change my plan?','Yes. Contact the team before your next billing period to adjust your plan. Full Service campaigns are scoped separately, with the deliverables and timeline agreed in writing.'],
 ['Do I get to approve creator content?','Yes. Set your brief and review content in the campaign workspace before publishing. You set the guardrails; creators bring their own voice.'],
 ['Can I use the videos in other places?','Usage rights depend on each creator agreement. Confirm channels, duration and editing rights before reusing content. Platform access does not grant automatic ownership of creator work.']
 ];
 for(const [i,f]of faqs.entries())await db.fAQ.upsert({where:{id:'seed-faq-'+i},create:{id:'seed-faq-'+i,question:f[0]!,answer:f[1]!,order:i},update:{}});
 await db.pricingPlan.upsert({where:{plan:'SELF_SERVICE'},create:{plan:'SELF_SERVICE',name:'Self Service',monthly:199,annual:1908,currency:'USD',features:['Access to 250K+ creator network','3 active campaigns at a time','Creator discovery & campaign briefs','Live analytics & content library','Email support from actual humans']},update:{}});
 await db.pricingPlan.upsert({where:{plan:'FULL_SERVICE'},create:{plan:'FULL_SERVICE',name:'Full Service',monthly:0,annual:0,currency:'USD',features:['Everything in Self Service','Dedicated campaign strategist','Creator sourcing & negotiations','Briefing, approvals & campaign delivery','Weekly reporting. Useful, not 40 pages.']},update:{}});
 for(const [order,a]of allAssets.entries())await db.mediaAsset.upsert({where:{id:a.id},create:{...a,order,uploadedBy:admin.id,scanStatus:'CLEAN',showcase:true},update:{}});
 for(let d=1;d<=45;d++){const day=DateTime.utc().startOf('day').plus({days:d});if(day.weekday>5)continue;for(const [hour,minute]of [[10,0],[11,30],[14,0],[15,30]]){const startsAt=day.set({hour,minute}).toJSDate();await db.availabilitySlot.upsert({where:{startsAt},create:{startsAt,endsAt:new Date(startsAt.getTime()+1800000)},update:{}});}}
 await db.siteStat.upsert({where:{id:'main'},create:{id:'main',creators:4,views:4830000,posts:16,countries:4},update:{}});
 console.log('Demo seed complete. Development accounts: admin@trendhive.test, brand@trendhive.test, creator1@trendhive.test. Password supplied by SEED_ADMIN_PASSWORD or documented development default.');
}
seed().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
