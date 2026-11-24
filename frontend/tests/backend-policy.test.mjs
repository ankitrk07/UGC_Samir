import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedRoute,needsSession,isSameOrigin,sessionMaxAge,publicAuthResponse,safeErrorMessage} from '../src/lib/backend-policy.mjs';
test('REST bridge permits only explicitly implemented methods and paths',()=>{
 assert.equal(allowedRoute('auth/login','POST'),true);
 assert.equal(allowedRoute('campaigns','GET'),true);
 assert.equal(allowedRoute('campaigns','POST'),true);
 for(const path of ['../admin','https://evil.example','auth/login/extra','users','campaigns/../../auth'])assert.equal(allowedRoute(path,'POST'),false);
 assert.equal(allowedRoute('auth/login','GET'),false);
 assert.equal(allowedRoute('campaigns','DELETE'),false);
});
test('workspace data requires a session while public forms remain available',()=>{
 for(const path of ['campaigns','creators','analytics','brand/onboarding','auth/me'])assert.equal(needsSession(path),true);
 for(const path of ['auth/login','newsletter','bookings','creators/apply'])assert.equal(needsSession(path),false);
});
test('cross-origin and absent-origin writes are rejected',()=>{
 assert.equal(isSameOrigin('https://trendhive.example','https://trendhive.example/api/backend/campaigns'),true);
 assert.equal(isSameOrigin('https://evil.example','https://trendhive.example/api/backend/campaigns'),false);
 assert.equal(isSameOrigin('https://trendhive.example.evil.example','https://trendhive.example'),false);
 assert.equal(isSameOrigin('http://trendhive.example','https://trendhive.example'),false);
 assert.equal(isSameOrigin(null,'https://trendhive.example'),false);
 assert.equal(isSameOrigin('not a URL','https://trendhive.example'),false);
});
test('auth responses never return raw JWTs, refresh tokens or private user fields',()=>{
 const result=publicAuthResponse({accessToken:'secret',token:'secret',refreshToken:'refresh',user:{id:'1',name:'Jordan',email:'j@example.com',passwordHash:'hash',accessToken:'secret'},message:'Welcome'},'secret');
 assert.deepEqual(result,{authenticated:true,user:{id:'1',name:'Jordan',email:'j@example.com'},message:'Welcome'});
 assert.equal(JSON.stringify(result).includes('secret'),false);
 assert.equal(publicAuthResponse({},undefined).authenticated,false);
});
test('cookie lifetime has a finite default and a seven-day ceiling',()=>{
 assert.equal(sessionMaxAge(undefined),86400);assert.equal(sessionMaxAge('bad'),86400);assert.equal(sessionMaxAge(Infinity),86400);assert.equal(sessionMaxAge(-5),86400);assert.equal(sessionMaxAge(3600),3600);assert.equal(sessionMaxAge(999999999),604800);assert.equal(sessionMaxAge(.5),1);
});
test('backend errors avoid disclosing server internals',()=>{
 assert.equal(safeErrorMessage({message:'db password=secret'},500).includes('secret'),false);
 assert.equal(safeErrorMessage({message:'That email is already in use.'},409),'That email is already in use.');
 assert.equal(safeErrorMessage({},401),'Your session has expired. Please log in again.');
 assert.equal(safeErrorMessage({message:'x'.repeat(900)},400).length,300);
});
