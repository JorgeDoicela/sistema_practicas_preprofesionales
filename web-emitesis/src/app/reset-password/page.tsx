'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { sanitizePasswordClient } from '@/utils/security';
import { useLanguage } from '@/providers/LanguageProvider';

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: t.resetPassword.invalidToken });
    }
  }, [token, t.resetPassword.invalidToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t.resetPassword.mismatch });
      return;
    }

    if (!token) return;

    setLoading(true);
    setMessage(null);

    try {
      const cleanPassword = sanitizePasswordClient(password);
      await authService.resetPassword(token, cleanPassword);
      setMessage({ type: 'success', text: t.resetPassword.success });
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 font-medium">{t.resetPassword.invalidToken}</p>
        <Link href="/olvido-password" className="text-[#003366] hover:underline">
          {t.forgotPassword.submit}
        </Link>
        <p className="pt-4">
          <Link href="/privacidad" className="text-xs text-slate-500 hover:text-[#003366] underline-offset-2 hover:underline">
            {t.login.privacyLink}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.resetPassword.password}</label>
          <input
            type="password"
            required
            className="appearance-none block w-full px-6 py-3.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            placeholder={t.resetPassword.minChars}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.resetPassword.confirm}</label>
          <input
            type="password"
            required
            className="appearance-none block w-full px-6 py-3.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            placeholder={t.resetPassword.minChars}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full btn-pill-primary py-4 text-sm font-bold cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? t.resetPassword.submitting : t.resetPassword.submit}
      </button>
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold text-center border mt-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.text}
        </div>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6 md:space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-[2.25rem] shadow-premium border border-slate-100/60">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-blue tracking-tight">{t.resetPassword.title}</h2>
          <p className="mt-2 text-sm text-gray-500">{t.resetPassword.subtitle}</p>
        </div>

        <Suspense fallback={<div className="text-center">{t.common.loading}</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-xs text-slate-500 pt-4">
          <Link href="/privacidad" className="text-brand-gold font-bold hover:text-brand-blue transition-colors hover:underline underline-offset-2">
            {t.login.privacyLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
