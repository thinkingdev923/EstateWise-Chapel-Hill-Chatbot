"use client";

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Import shadcn UI components (adjust paths as needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (res.status === 200) {
        const data = await res.json();
        // Store the token in a browser cookie
        Cookies.set("estatewise_token", data.token);
        // Store user data in local storage
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        toast.success("You have successfully logged in.");
        router.push("/chat");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
      toast(errorMsg);
    }
  };

  return (
    <>
      <Head>
        <title>EstateWise | Login</title>
        <meta name="description" content="Login to EstateWise" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 px-4">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="p-8 rounded-xl shadow-2xl bg-card">
            <h1 className="text-3xl font-bold text-center text-card-foreground">
              Log In
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full py-2 mt-4">
                Log In
              </Button>
            </form>
            <p className="text-sm text-center mt-2 text-card-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary underline">
                Sign Up
              </Link>
            </p>
            <p className="text-sm text-center mt-0 text-card-foreground">
              Forgot your password?{" "}
              <Link href="/reset-password" className="text-primary underline">
                Reset Password
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
