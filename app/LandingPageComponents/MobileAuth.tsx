/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { db } from '../services/database';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { useUser } from '../UserContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


export default function MobileAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useUser();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [town, setTown] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        if (isLogin) {
            const data= await db.authenticate(email, password);
            if (data.success) {
                const user = data.user;
                setUser(user);
                router.push('/home/dashboard');
            } else {
                throw new Error(data.error || "Authentication failed");
            }
        } else {
            await db.register(name, email, password, city, town);
        }    
    } catch (err: any) {
        setError(err.message || "An error occurred");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white bg-cover bg-center bg-no-repeat" 
    style={{backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop')`}}>
        <div className="flex items-center gap-3 w-full">
          <div className="relative w-full h-15 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/gateman_w_nobg_cropped.png" 
                alt="GateMan Logo"
                fill
                className="object-contain p-1"
              />
          </div>
        </div>
        <div className="w-full flex items-center justify-center p-1">
            <div className="w-full max-w-md space-y-8 bg-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-slate-700">
                {isLogin ? 'Enter your details to access your account' : 'Join your community today'}
                </p>
            </div>
            
            <div className={`${error ? 'bg-rose-50' : 'bg-transparent'} text-rose-600 p-2 h-12 rounded-xl flex items-center gap-3 text-sm font-bold ${error && 'border border-rose-100'} animate-shake`}>
                {error && 
                <>
                <AlertCircle size={18} />
                {error}
                </>
                }              
            </div>          

            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                <>
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Estate Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                        placeholder="John Doe"
                        />
                    </div>
                    </div>
                </>
                )}

                <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                    placeholder="name@company.com"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                    placeholder="••••••••"
                    />
                </div>
                </div>

                {!isLogin && (
                <>
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">City</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                        placeholder="lagos City..."
                        />
                    </div>
                    </div>

                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Town</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                        type="text"
                        required
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                        placeholder="Isolo..."
                        />
                    </div>
                    </div>
                </>
                )}
                
                {isLogin && (
                <div className="flex items-center justify-between">
                    <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input id="remember" type="checkbox" className="w-4 h-4 border border-slate-300 rounded bg-slate-50 focus:ring-3 focus:ring-indigo-300" />
                    </div>
                    <label htmlFor="remember" className="ml-2 text-sm font-medium text-slate-700">Remember me</label>
                    </div>
                    <a href="#" className="text-sm font-bold text-indigo-600 hover:underline">Forgot Password?</a>
                </div>
                )}

                <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center text-white bg-primary/60 hover:bg-primary focus:ring-4 focus:ring-indigo-300 font-bold rounded-2xl text-lg px-5 py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="ml-2" />
                    </>
                )}
                </button>
            </form>

            <div className="text-center">
                <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="font-bold text-indigo-600">{isLogin ? "Sign up" : "Sign in"}</span>
                </button>
            </div>
            </div>
        </div>
    </div>
  );
};