"use client";

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  // Verifies if the user exists for the given email.
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (res.status === 200) {
        setIsVerified(true);
        setSuccessMsg("Email verified. Please enter your new password.");
        toast.success("Email verified. Please enter your new password.");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Email verification failed");
        toast.error(errData.error || "Email verification failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    }
  };

  // Resets the password for the verified email.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        },
      );
      if (res.status === 200) {
        const data = await res.json();
        setSuccessMsg(data.message || "Password reset successfully");
        setTimeout(() => router.push("/login"), 1000);
        toast.success("Password reset successfully");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to reset password");
        toast.error(errData.error || "Failed to reset password");
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
        <title>EstateWise | Reset Password</title>
        <meta name="description" content="Reset your password for EstateWise" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 px-4">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="p-8 rounded-xl shadow-2xl bg-card">
            <h1 className="text-3xl font-bold mb-6 text-center text-card-foreground">
              Reset Password
            </h1>
            {errorMsg && (
              <motion.p
                className="text-destructive mb-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errorMsg}
              </motion.p>
            )}
            {successMsg && (
              <motion.p
                className="text-success mb-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {successMsg}
              </motion.p>
            )}
            {!isVerified ? (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
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
                <Button type="submit" className="w-full py-2 mt-4">
                  Verify Email
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">
                    Confirm New Password
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
                  Reset Password
                </Button>
              </form>
            )}
            <p className="text-sm text-center mt-4 text-card-foreground">
              Remembered your password?{" "}
              <Link href="/login" className="text-primary underline">
                Log In
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
