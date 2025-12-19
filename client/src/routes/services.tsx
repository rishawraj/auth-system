import {
  ShieldCheckIcon,
  UserCircleIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  GlobeAsiaAustraliaIcon,
} from "@heroicons/react/24/outline";
import { createFileRoute } from "@tanstack/react-router";

import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function ServiceCard({
  title,
  description,
  icon: Icon,
}: Readonly<ServiceCardProps>) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
        <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function ServicesPage() {
  const services = [
    {
      title: "Secure Authentication",
      description:
        "Industry-standard security with email verification, JWT tokens, and bcrypt password hashing.",
      icon: ShieldCheckIcon,
    },
    {
      title: "Profile Management",
      description:
        "Customize profiles with AWS S3 picture uploads, backup email setup, and account settings.",
      icon: UserCircleIcon,
    },
    {
      title: "Activity Monitoring",
      description:
        "Track login history, monitor devices, and receive instant alerts for suspicious activities.",
      icon: BellIcon,
    },
    {
      title: "Multi-Device Support",
      description:
        "Manage and control access across devices with advanced authorization features.",
      icon: DevicePhoneMobileIcon,
    },
    {
      title: "Two-Factor Authentication",
      description:
        "Enhanced security with 2FA, backup codes, and emergency access protocols.",
      icon: LockClosedIcon,
    },
    {
      title: "OAuth Integration",
      description:
        "Seamless sign-in with Google OAuth2.0 and support for multiple authentication methods.",
      icon: GlobeAsiaAustraliaIcon,
    },
  ];

  return (
    <>
      <NavBar />
      <div className="mt-8 min-h-screen bg-gray-50 dark:bg-gray-900">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Authentication Services
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Enterprise-grade authentication system with advanced security
              features, user management, and real-time monitoring capabilities.
            </p>
          </div>

          {/* Services Grid */}
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.title}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
