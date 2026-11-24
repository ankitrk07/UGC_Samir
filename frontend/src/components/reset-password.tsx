'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupSchema } from '@/lib/schemas';
import { submit } from '@/lib/api';
import { Button, FieldError } from './ui';
const schema=z.object({password:signupSchema.shape.password,confirm:z.string()}).refine(v=>v.password===v.confirm,{message:'Your passwords don’t match.',path:['confirm']});
export function ResetPasswordForm({token}:{token:string}){
 const [done,setDone]=useState(false),[error,setError]=useState('');
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema)});
 if(!token)return <div className="hive-form"><h1>A link<br/><em>went missing.</em></h1><p className="form-intro">Open the complete link from your email, or request a fresh one.</p><Button href="/forgot-password">Get a new reset link</Button></div>;
 if(done)return <div className="hive-form"><h1>Fresh password.<br/><em>Fresh start.</em></h1><p className="form-intro">You’re ready to get back to your hive.</p><Button href="/login">Back to login</Button></div>;
 return <form className="hive-form" noValidate onSubmit={handleSubmit(async(data)=>{setError('');try{await submit('auth/reset-password',{token,password:data.password});setDone(true);}catch(e){setError(e instanceof Error?e.message:'Please try again.');}})}><span className="eyebrow form-eyebrow">LET’S START FRESH</span><h1>A new<br/><em>password.</em></h1><p className="form-intro">At least 8 characters. A capital. A number. Something you’ll remember.</p><div className="form-field"><label htmlFor="reset-password">New password</label><input id="reset-password" type="password" autoComplete="new-password" {...register('password')}/><FieldError message={errors.password?.message}/></div><div className="form-field"><label htmlFor="reset-confirm">Confirm password</label><input id="reset-confirm" type="password" autoComplete="new-password" {...register('confirm')}/><FieldError message={errors.confirm?.message}/></div>{error&&<p className="server-error" role="alert">{error}</p>}<Button type="submit" className="form-submit" disabled={isSubmitting}>{isSubmitting?'Saving…':'Save my new password'}</Button></form>;
}
