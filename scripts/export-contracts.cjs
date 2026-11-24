// Offline contract exporter: evaluates route declarations with real Zod, never executes handlers.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
process.chdir(path.resolve(__dirname,'..'));
const registry=[],cache=new Map();
function sharedPageSchema(){const file='backend/src/core/http.ts';const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);let expression;function walk(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='pageSchema')expression=node.initializer.getText(source);ts.forEachChild(node,walk);}walk(source);if(!expression)throw new Error('Pagination schema missing');return vm.runInNewContext('('+expression+')',{z:require('zod').z});}
const noop=()=>{};
const app={use:noop,post:noop};
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const localRequire=name=>{
  if(name==='zod')return require('zod');
  if(name.endsWith('/core/http'))return {route:(_app,definition)=>registry.push(definition),rateLimit:noop,pageSchema:sharedPageSchema()};
  if(name.endsWith('/config'))return {env:{SITE_URL:'http://localhost:3000',API_URL:'http://localhost:4000'}};
  if(name.endsWith('/auth/routes'))return load(path.resolve(path.dirname(file),name+'.ts'));
  if(name==='@aws-sdk/client-s3')return {S3Client:class{}};
  if(name==='express')return {raw:noop};
  return {};
 };
 vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{URL,process:{env:{}},Buffer,console})(localRequire,module,module.exports);
 cache.set(file,module.exports);return module.exports;
}
for(const [folder,name]of [['auth','authRoutes'],['campaigns','campaignRoutes'],['analytics','analyticsRoutes'],['social','socialRoutes'],['media','mediaRoutes'],['payments','paymentRoutes'],['chat','chatRoutes'],['public','publicRoutes'],['admin','adminRoutes'],['compliance','complianceRoutes']])load('backend/src/modules/'+folder+'/routes.ts')[name](app);
function json(z){
 const d=z._def,t=d.typeName;
 if(t==='ZodOptional'||t==='ZodNullable'||t==='ZodDefault'||t==='ZodEffects'){
  const s=json(d.innerType??d.schema);
  if(t==='ZodNullable')s.nullable=true;if(t==='ZodDefault')s.default=d.defaultValue();if(t==='ZodEffects'&&d.effect.type==='refinement')s.description='Additional server validation applies; see API contract.';
  return s;
 }
 if(t==='ZodObject'){const shape=d.shape(),properties={},required=[];for(const [k,v]of Object.entries(shape)){properties[k]=json(v);if(!v.isOptional())required.push(k);}return {type:'object',properties,required,additionalProperties:d.unknownKeys!=='strict'};}
 if(t==='ZodArray')return {type:'array',items:json(d.type),...(d.minLength?{minItems:d.minLength.value}:{}),...(d.maxLength?{maxItems:d.maxLength.value}:{})};
 if(t==='ZodEnum')return {type:'string',enum:d.values};
 if(t==='ZodLiteral')return {type:typeof d.value,enum:[d.value]};
 if(t==='ZodUnion')return {anyOf:d.options.map(json)};
 const s={type:({ZodString:'string',ZodNumber:'number',ZodBoolean:'boolean',ZodDate:'string'})[t]??'object'};
 for(const c of d.checks??[]){if(c.kind==='min')s[t==='ZodString'?'minLength':'minimum']=c.value;if(c.kind==='max')s[t==='ZodString'?'maxLength':'maximum']=c.value;if(c.kind==='int')s.type='integer';if(['email','url','date','datetime'].includes(c.kind))s.format=({url:'uri',datetime:'date-time'})[c.kind]??c.kind;if(c.kind==='regex')s.pattern=c.regex.source;}
 return s;
}
const schemas={
 Campaign:{type:'object',required:['id','name','category','status','creators','views','budget'],properties:{id:{type:'string'},name:{type:'string'},category:{type:'string'},status:{type:'string',enum:['Live','Review','Completed','Draft','Cancelled']},creators:{type:'integer'},views:{type:'integer'},budget:{type:'number'},brief:{type:'string'},currency:{type:'string'},platforms:{type:'array',items:{type:'string'}},countries:{type:'array',items:{type:'string'}}}},
 Creator:{type:'object',required:['id','handle','niche','country','followers','engagement'],properties:{id:{type:'string'},handle:{type:'string'},niche:{type:'string'},country:{type:'string'},followers:{type:'integer'},engagement:{type:'number'}}},
 Analytics:{type:'object',required:['totalViews','engagement','activeCreators','earnedValue','series'],properties:{totalViews:{type:'number'},engagement:{type:'number'},activeCreators:{type:'integer'},earnedValue:{type:'number'},reach:{type:'number'},roi:{type:'number'},cpv:{type:'number'},series:{type:'array',items:{type:'object',required:['day','views','engagement','roi'],properties:{day:{type:'string'},date:{type:'string',format:'date'},views:{type:'number'},engagement:{type:'number'},roi:{type:'number'}}}}}},
 Error:{type:'object',required:['code','message'],properties:{code:{type:'string'},message:{type:'string'}}}
};
const paths={};
function envelope(data){return {type:'object',required:['success','data','error','meta'],properties:{success:{type:'boolean'},data,error:{nullable:true,$ref:'#/components/schemas/Error'},meta:{type:'object',nullable:true,additionalProperties:true}}};}
for(const r of registry){
 const url='/api/v1'+r.path.replace(/:([A-Za-z]+)/g,'{$1}'),parameters=[...[...r.path.matchAll(/:([A-Za-z]+)/g)].map(m=>({name:m[1],in:'path',required:true,schema:{type:'string',maxLength:100}}))];
 if(r.query){const q=json(r.query);for(const [name,schema]of Object.entries(q.properties??{}))parameters.push({name,in:'query',required:q.required.includes(name),schema});}
 let data={};
 if(r.path==='/campaigns')data=r.method==='get'?{type:'array',items:{$ref:'#/components/schemas/Campaign'}}:{$ref:'#/components/schemas/Campaign'};
 if(r.path==='/creators')data={type:'array',items:{$ref:'#/components/schemas/Creator'}};
 if(r.path==='/analytics')data={$ref:'#/components/schemas/Analytics'};
 paths[url]??={};paths[url][r.method]={summary:r.summary,operationId:r.method+'_'+r.path.replace(/[^a-zA-Z0-9]/g,'_'),parameters,...(r.auth||r.roles?{security:[{bearerAuth:[]},{cookieAuth:[]}]}:{}),...(r.roles?{'x-roles':r.roles}:{}),...(r.schema?{requestBody:{required:true,content:{'application/json':{schema:json(r.schema)}}}}:{}),responses:{200:{description:'Success',content:{'application/json':{schema:envelope(data)}}},400:{description:'Validation error'},401:{description:'Authentication required'},403:{description:'Forbidden'},409:{description:'State conflict'},429:{description:'Rate limited'}}};
}
for(const p of ['stripe','razorpay'])paths['/api/v1/payments/webhooks/'+p]={post:{summary:'Signed raw-body '+p+' webhook',parameters:[{name:p==='stripe'?'stripe-signature':'x-razorpay-signature',in:'header',required:true,schema:{type:'string'}}],responses:{200:{description:'Acknowledged'},400:{description:'Invalid signature'}}}};
const spec={openapi:'3.0.3',info:{title:'TRENDHIVE API',version:'1.0.0',description:'Generated offline from executable route declarations with real Zod schemas. Runtime /openapi.json uses the same route registry. Money fields ending Minor are integer minor units.'},servers:[{url:'http://localhost:4000'}],paths,components:{schemas,securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'},cookieAuth:{type:'apiKey',in:'cookie',name:'th_access'}}}};
if(require.main===module){
fs.writeFileSync('backend/openapi.json',JSON.stringify(spec,null,2)+'\n');
fs.mkdirSync('backend/postman',{recursive:true});
fs.writeFileSync('backend/postman/TRENDHIVE.postman_collection.json',JSON.stringify({info:{name:'TRENDHIVE API',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},variable:[{key:'baseUrl',value:'http://localhost:4000'},{key:'accessToken',value:''}],auth:{type:'bearer',bearer:[{key:'token',value:'{{accessToken}}',type:'string'}]},item:Object.entries(paths).flatMap(([url,methods])=>Object.entries(methods).map(([method,o])=>({name:o.summary,request:{method:method.toUpperCase(),url:'{{baseUrl}}'+url,header:[{key:'Content-Type',value:'application/json'},{key:'Idempotency-Key',value:'{{$guid}}'}],...(o.requestBody?{body:{mode:'raw',raw:'{}',options:{raw:{language:'json'}}}}:{})}})))},null,2)+'\n');
function type(s){if(s.$ref)return 'components["schemas"]["'+s.$ref.split('/').pop()+'"]';if(s.enum)return s.enum.map(v=>JSON.stringify(v)).join(' | ');if(s.anyOf)return s.anyOf.map(type).join(' | ');let t='unknown';if(s.type==='string')t='string';if(s.type==='integer'||s.type==='number')t='number';if(s.type==='boolean')t='boolean';if(s.type==='array')t='Array<'+type(s.items)+'>';if(s.type==='object')t='{ '+Object.entries(s.properties??{}).map(([k,v])=>JSON.stringify(k)+(s.required?.includes(k)?'':'?')+': '+type(v)+';').join(' ')+' }';return t+(s.nullable?' | null':'');}
let types='// Generated from backend/openapi.json by scripts/export-contracts.cjs. Do not edit.\nexport interface components { schemas: {\n';
for(const [name,s]of Object.entries(schemas))types+=JSON.stringify(name)+': '+type(s)+';\n';types+='}; }\nexport interface paths {\n';
for(const [url,methods]of Object.entries(paths)){types+=JSON.stringify(url)+': {\n';for(const [method,o]of Object.entries(methods)){const input=o.requestBody?.content['application/json'].schema;const output=o.responses[200]?.content?.['application/json']?.schema;types+=method+': { '+(input?'requestBody: '+type(input)+'; ':'')+'response: '+(output?type(output):'unknown')+'; };\n';}types+='};\n';}
types+='}\n';fs.mkdirSync('frontend/src/lib/generated',{recursive:true});fs.writeFileSync('frontend/src/lib/generated/api.d.ts',types);
fs.writeFileSync('docs/ROUTE-INVENTORY.md','# Route inventory\n\n| Method | Path | Roles | Purpose |\n|---|---|---|---|\n'+registry.map(r=>'| '+r.method.toUpperCase()+' | /api/v1'+r.path+' | '+(r.roles?.join(', ')??(r.auth?'Authenticated':'Public'))+' | '+r.summary+' |').join('\n')+'\n');
console.log('Exported '+registry.length+' operations, '+Object.keys(paths).length+' paths, Postman collection and frontend types.');

}
module.exports={registry,spec,json};
