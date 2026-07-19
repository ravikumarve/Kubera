"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Terminal } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const demoCreds = { email: "dev@kubera.dev", password: "demo1234" };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 font-mono"
      style={{ backgroundColor: "var(--bg-void)" }}
    >
      {/* Theme toggle — top right */}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="fixed top-6 right-6 flex items-center gap-2 px-3 py-2 border text-[11px] tracking-widest uppercase font-mono transition-colors z-20"
          style={{
            borderColor: "var(--border-faint)",
            color: "var(--text-muted)",
            backgroundColor: "var(--bg-surface)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-main)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0"
            style={{
              backgroundColor: "var(--accent)",
              borderRadius: theme === "vault" ? "2px" : "50%",
            }}
          />
          {theme === "kinetic" ? "Mint" : "Vault"}
        </button>
      )}

      <div className="w-full max-w-sm" style={{ color: "var(--text-main)" }}>
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Shield className="h-5 w-5" style={{ color: "var(--bg-void)" }} />
          </div>
          <span
            className="text-xl font-bold tracking-widest uppercase"
            style={{ color: "var(--text-main)" }}
          >
            KUBERA
          </span>
        </Link>

        {/* Sign-in prompt */}
        <div className="text-center mb-8">
          <div
            className="text-[11px] tracking-[0.2em] uppercase mb-1"
            style={{ color: "var(--text-faint)" }}
          >
            Secure Access
          </div>
          <h1 className="text-lg font-bold tracking-wide uppercase">
            Sign In
            <span
              className="ml-2 animate-pulse"
              style={{ color: "var(--accent)" }}
            >
              _
            </span>
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleCredentials}
          className="space-y-5"
          style={{ color: "var(--text-main)" }}
        >
          <div className="space-y-1.5">
            <label
              className="text-[11px] tracking-wider uppercase font-mono"
              style={{ color: "var(--text-faint)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 text-[13px] font-mono outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-panel)",
                border: "1px solid var(--border-faint)",
                color: "var(--text-main)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-faint)";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-[11px] tracking-wider uppercase font-mono"
              style={{ color: "var(--text-faint)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 text-[13px] font-mono outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-panel)",
                border: "1px solid var(--border-faint)",
                color: "var(--text-main)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-faint)";
              }}
            />
          </div>

          {error && (
            <p className="text-[12px] font-mono text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-[12px] font-bold tracking-wider uppercase font-mono transition-colors"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg-void)",
              border: "1px solid var(--accent)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "var(--accent)";
                e.currentTarget.style.color = "var(--bg-void)";
              }
            }}
          >
            {loading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: "1px solid var(--border-faint)" }} />
          </div>
          <div className="relative flex justify-center">
            <span
              className="px-3 text-[10px] tracking-widest uppercase font-mono"
              style={{ color: "var(--text-faint)", backgroundColor: "var(--bg-void)" }}
            >
              Or continue with
            </span>
          </div>
        </div>

        {/* Google sign-in */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full py-3 text-[12px] tracking-wider uppercase font-mono transition-colors"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-faint)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-main)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border-faint)";
          }}
        >
          Sign in with Google
        </button>

        {/* Demo credentials hint */}
        <div
          className="mt-8 px-4 py-3 text-center text-[11px] font-mono leading-5"
          style={{
            border: "1px solid var(--border-faint)",
            color: "var(--text-faint)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <span className="text-[var(--accent)]">$</span> demo:{" "}
          <span className="text-[var(--text-muted)]">{demoCreds.email}</span> /{" "}
          <span className="text-[var(--text-muted)]">{demoCreds.password}</span>
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-2.5 text-[10px] font-mono"
        style={{
          borderTop: "1px solid var(--border-faint)",
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-faint)",
        }}
      >
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <span>KUBERA v1.0.0</span>
          <span style={{ color: "var(--accent)" }}>●</span>
          <span>Secure Connection</span>
        </div>
      </div>
    </div>
  );
}
