import fs from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
const source=(await fs.readFile('src/config/assets.ts','utf8')).replace(/^\uFEFF/,'');
const javascript=stripTypeScriptTypes(source);
const {allAssets,creatorMedia,creatorVideos,logos}=await import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'));
assert.equal(creatorMedia.length,6);
assert.equal(creatorVideos.length,3);
assert.equal(logos.length,8);
assert.equal(new Set(allAssets.map(a=>a.type+':'+a.id)).size,allAssets.length);
for(const asset of allAssets){
 for(const key of ['id','section','url','finalPath','size','type','alt'])assert.equal(typeof asset[key],'string',asset.id+' missing '+key);
 assert.ok(asset.finalPath.startsWith('/assets/'));
 if(asset.url.startsWith('/')&&!asset.url.startsWith('/opengraph-image'))await fs.access('public'+asset.url);
 if(asset.type==='video')assert.ok(asset.url.endsWith('.mp4'));
}
const files=await fs.readdir('src/components');
for(const file of files.filter(f=>f.endsWith('.tsx'))){
 const code=await fs.readFile('src/components/'+file,'utf8');
 assert.ok(!/https:\/\/(?:picsum|storage\.googleapis|interactive-examples)/.test(code),'Media URL outside asset catalog: '+file);
}
console.log('PASS: '+allAssets.length+' catalog entries, all local logos, and centralized component media references.');
