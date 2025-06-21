import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const features = [
    {
      title: "Secure Authentication",
      description: "Email/password login with bcrypt password hashing",
      icon: "🔒",
    },
    {
      title: "Social Login",
      description: "Google OAuth2.0 integration for quick access",
      icon: "🌐",
    },
    {
      title: "Email Verification",
      description: "Secure email verification system",
      icon: "✉️",
    },
    {
      title: "Password Reset",
      description: "Secure password reset flow with email confirmation",
      icon: "🔑",
    },
    {
      title: "Profile Management",
      description: "User profile customization and settings",
      icon: "👤",
    },
    {
      title: "Admin Dashboard",
      description: "Complete user management for administrators",
      icon: "⚙️",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-24 text-center"
      >
        <h1 className="mb-6 text-5xl font-bold text-gray-900 dark:text-white">
          Secure Authentication System
        </h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
          A complete authentication solution with advanced security features
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto grid grid-cols-1 gap-8 px-4 pb-16 md:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
          >
            <div className="mb-4 text-4xl">{feature.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="container mx-auto px-4 pb-16 text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          onClick={() => (window.location.href = "/register")}
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}
