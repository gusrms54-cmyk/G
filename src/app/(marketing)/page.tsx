"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Icons.ai,
    title: "열마다 AI 기능",
    description: "각 열에 AI 기능을 할당하여 자동으로 데이터를 처리합니다",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Icons.table,
    title: "스마트 자동 채우기",
    description: "패턴을 인식하고 다음 값을 예측하여 자동으로 채웁니다",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Icons.insight,
    title: "패턴 학습",
    description: "사용자의 수정을 학습하여 점점 더 정확한 결과를 제공합니다",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Icons.template,
    title: "업종별 템플릿",
    description: "다양한 업종에 맞는 시트 템플릿을 제공합니다",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Icons.home,
    title: "대시보드",
    description: "데이터를 한눈에 파악할 수 있는 시각화 대시보드",
    color: "from-cyan-500 to-blue-500",
  },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  if (user) {
    router.push("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signUp({ email, password, name });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google 로그인에 실패했습니다."
      );
      setIsGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b]">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 left-1/3 h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-transparent blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 xl:px-24">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Icons.table className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SheetAI</span>
          </div>

          {/* Hero text */}
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              시트를 넘어선
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI 운영체계
              </span>
            </h1>
            <p className="max-w-lg text-lg text-zinc-400 sm:text-xl">
              데이터를 입력하면 AI가 분석하고, 패턴을 학습하고, 더 나은 결정을
              돕습니다.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                    feature.color
                  )}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges - hidden on mobile */}
          <div className="mt-12 hidden lg:block">
            <p className="mb-4 text-sm text-zinc-600">Powered by</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-zinc-500">
                <Icons.ai className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Claude AI</span>
              </div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-2 text-zinc-500">
                <svg className="h-5 w-5" viewBox="0 0 109 113" fill="none">
                  <path
                    d="M63.708 110.284C90.058 110.284 109.708 86.634 109.708 56.634C109.708 26.634 90.058 3.98404 63.708 3.98404C37.358 3.98404 17.708 26.634 17.708 56.634C17.708 86.634 37.358 110.284 63.708 110.284Z"
                    fill="#3ECF8E"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.708 56.634C17.708 26.634 37.358 3.98404 63.708 3.98404V0H63.708H0V113H63.708V110.284C37.358 110.284 17.708 86.634 17.708 56.634Z"
                    fill="#3ECF8E"
                    fillOpacity="0.5"
                  />
                </svg>
                <span className="text-sm font-medium">Supabase</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as "login" | "signup");
                  resetForm();
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">로그인</TabsTrigger>
                  <TabsTrigger value="signup">회원가입</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-zinc-300">
                        이메일
                      </Label>
                      <div className="relative">
                        <Icons.mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-zinc-300">
                        비밀번호
                      </Label>
                      <div className="relative">
                        <Icons.lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      로그인
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-zinc-300">
                        이름
                      </Label>
                      <div className="relative">
                        <Icons.user className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="홍길동"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-zinc-300">
                        이메일
                      </Label>
                      <div className="relative">
                        <Icons.mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-zinc-300">
                        비밀번호
                      </Label>
                      <div className="relative">
                        <Icons.lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          disabled={isLoading}
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        최소 6자 이상 입력해주세요
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      가입하기
                    </Button>
                  </form>
                </TabsContent>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">또는</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-800"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                  )}
                  Google로 계속하기
                </Button>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-zinc-500">
                  계속 진행하면{" "}
                  <Link href="/terms" className="text-indigo-400 hover:underline">
                    이용약관
                  </Link>
                  {" 및 "}
                  <Link href="/privacy" className="text-indigo-400 hover:underline">
                    개인정보 처리방침
                  </Link>
                  에 동의하게 됩니다.
                </p>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
