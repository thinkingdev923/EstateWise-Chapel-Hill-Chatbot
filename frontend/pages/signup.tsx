"use client";

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { toast } from "sonner";
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

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate that password and confirmation match
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        },
      );

      if (res.status === 201) {
        // Automatically log the user in upon successful sign up
        const loginRes = await fetch(
          "https://estatewise-backend.vercel.app/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          },
        );
        if (loginRes.status === 200) {
          const data = await loginRes.json();
          Cookies.set("estatewise_token", data.token);
          router.push("/chat");
          toast.success("Sign up and login successfully");
        } else {
          setErrorMsg(
            "Sign up succeeded but automatic login failed. Please log in manually.",
          );
          toast.error(
            "Sign up succeeded but automatic login failed. Please log in manually.",
          );
        }
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Sign up failed");
        toast.error(errData.message || "Sign up failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>EstateWise | Sign Up</title>
        <meta name="description" content="Sign up for EstateWise" />
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
              Sign Up
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full py-2 mt-4">
                Sign Up
              </Button>
            </form>
            <p className="text-sm text-center mt-2 text-card-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
                Log In
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
