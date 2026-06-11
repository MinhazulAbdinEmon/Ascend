import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register. Is the server running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-3xl font-bold text-white">
          A<span className="text-neon">scend</span>
        </Link>

        <div className="glass p-8">
          <h1 className="font-display text-2xl font-bold text-white">Create your profile</h1>
          <p className="mt-1 text-sm text-slate-400">Everyone starts at Grinder. Few reach Sovereign.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ErrorMessage message={error} />

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
                className="input"
                placeholder="your_handle"
                value={form.username}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-slate-500">3–20 characters. Letters, numbers, underscores.</p>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating profile…' : 'Start climbing'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have a profile?{' '}
            <Link to="/login" className="font-semibold text-neon hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
