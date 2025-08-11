"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Schools",
    items: [
      { name: "Primary School", href: "/primary" },
      { name: "Secondary School", href: "/secondary" },
    ],
  },
  {
    title: "About",
    items: [
      { name: "Our Story", href: "/about" },
      { name: "Mission & Vision", href: "/mission" },
      { name: "Leadership", href: "/leadership" },
    ],
  },
  {
    title: "Enroll",
    items: [
      { name: "Admission Process", href: "/admission" },
      { name: "Requirements", href: "/requirements" },
      { name: "Tuition & Fees", href: "/tuition" },
    ],
  },
  {
    title: "Program",
    items: [
      { name: "Curriculum", href: "/curriculum" },
      { name: "Extra-Curricular", href: "/extra-curricular" },
      { name: "Student Life", href: "/student-life" },
    ],
  },
];

const NavMenu = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <img
                className="h-12 w-auto"
                src="/treasure.png"
                alt="Treasure Land School"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((menu) => (
              <div
                key={menu.title}
                className="relative"
                onMouseEnter={() => setActiveMenu(menu.title)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button className="px-3 py-2 text-gray-700 hover:text-primary transition-colors relative group">
                  {menu.title}
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: activeMenu === menu.title ? "100%" : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </button>

                <AnimatePresence>
                  {activeMenu === menu.title && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1"
                    >
                      {menu.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            <Button variant="default" size="lg" className="ml-8">
              Enroll Now
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavMenu;
