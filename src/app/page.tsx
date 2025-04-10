"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Menu,
  PhoneCall,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Features } from "./features";
import Events from "@/components/events";
import Call from "@/components/call-to-action";
import { TestimonialsSection } from "@/components/testimonials-with-marquee";
import JoinOurFamily from "@/components/join-our-family";

// Slider images
const sliderImages = [
  {
    src: "/boy.jpg",
    alt: "Students in classroom",
    title: "Excellence in Education ",
    description:
      "Nurturing young minds to become future leaders through quality education and character development at Treasure Land.",
  },
  {
    src: "/outside.jpg",
    alt: "School campus",
    title: "Smart Learning",
    description:
      "Our state-of-the-art facilities provide the perfect environment for academic and personal growth.",
  },
  {
    src: "/outdoor.jpg",
    alt: "Students outside",
    title: "Holistic Development",
    description:
      "We focus on developing well-rounded individuals through academics, sports, arts, and character education.",
  },
  {
    src: "/Teacher.jpg",
    alt: "Students outside",
    title: "Teach With Us!",
    description:
      "Join our team of dedicated educators and help shape the future of our students.",
  },
];

const testimonials = [
  {
    author: {
      name: "Sarah Johnson",
      handle: "Parent",
      avatar: "/boy.jpg",
    },
    text: "Treasure Land has provided my children with an exceptional education. The teachers are dedicated and the environment nurtures both academic excellence and personal growth.",
  },
  {
    author: {
      name: "Mr. David Alaba",
      handle: "Science Teacher",
      avatar: "/boy.jpg",
    },
    text: "Teaching at Treasure Land is truly rewarding. The school's commitment to innovation and student development creates an inspiring learning environment for both students and teachers.",
  },
  {
    author: {
      name: "Michael Adebayo",
      handle: "Grade 12 Student",
      avatar: "/boy.jpg",
    },
    text: "The opportunities I've had at Treasure Land have been amazing. From the science club to leadership programs, I've grown so much as a person and student.",
  },
  {
    author: {
      name: "Mrs. Patricia Okonjo",
      handle: "Parent",
      avatar: "/boy.jpg",
    },
    text: "The individual attention and care each student receives at Treasure Land is remarkable. My daughter has flourished academically and socially since joining.",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const [alumniOpen, setAlumniOpen] = useState(false);
  const [careersOpen, setCareersOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      // Add no-scroll class to body when mobile menu is open
      document.body.classList.add("overflow-hidden");
    } else {
      // Remove no-scroll class when mobile menu is closed
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup function to ensure scroll is enabled when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileMenuOpen]);

  // Auto-advance slider
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
      }, 10000); // Resume auto-advance after 10 seconds
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => {
    setIsPaused(true);
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setIsPaused(true);
    setCurrentSlide(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length
    );
  };

  const missionRef = useRef(null);
  const missionInView = useInView(missionRef, { once: true, amount: 0.5 });

  return (
    <main className=" min-h-screen flex flex-col">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
        style={{
          backdropFilter: isScrolled ? "none" : "blur(1px)",
          backgroundColor: isScrolled ? "white" : "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Top Bar */}
        <div className="hidden md:flex h-5 bg-white items-center w-full px-5 py-4 border-b border-gray-300">
          <div className="flex items-center justify-center gap-5">
            <div className="flex items-center justify-center gap-1 text-primary-green-text">
              <PhoneCall className="h-4 w-4 pt-0.5" />
              <small className="text-primary-green-text text-xs">
                +234 123 456 7890
              </small>
            </div>
            <div className="flex items-center justify-center gap-1 text-primary-green-text">
              <Mail className="h-4 w-4 pt-0.5" />
              <span className="text-primary-green-text text-xs">
                info@treasurelandschool.edu.ng
              </span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar*/}
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold flex items-center">
                <Image
                  src="/treasure.png"
                  alt="Treasureland Schools"
                  width={40}
                  height={40}
                  className="mr-2 rounded-full bg-white"
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-bold text-sm",
                      isScrolled ? "text-primary-green-text" : "text-white"
                    )}
                  >
                    TREASURE LAND
                  </span>
                  <span
                    className={cn(
                      "font-bold text-sm",
                      isScrolled ? "text-primary-green-text" : "text-white"
                    )}
                  >
                    MODEL SCHOOL
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:hidden lg:flex items-center">
              <div className="flex items-center">
                {/* Schools */}
                <div className="relative group cursor-pointer">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    Schools
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/schools/primary"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Primary School
                    </Link>
                    <Link
                      href="/schools/secondary"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Secondary School
                    </Link>
                  </div>
                </div>

                {/* About */}
                <div className="relative group cursor-pointer">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    About
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/about"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Our Story
                    </Link>
                    <Link
                      href="/about/team"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Our Team
                    </Link>
                    <Link
                      href="/about/facilities"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Facilities
                    </Link>
                    <Link
                      href="/program/curriculum"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Curriculum
                    </Link>
                    <Link
                      href="/program/extracurricular"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Extracurricular
                    </Link>
                  </div>
                </div>

                {/* Enroll */}
                <div className="relative group">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    Enroll
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/enroll/process"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Enrollment Process
                    </Link>
                    <Link
                      href="/enroll/requirements"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Requirements
                    </Link>
                  </div>
                </div>

                {/* Program */}
                <div className="relative group">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    Portals
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/program/curriculum"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Admin portal
                    </Link>
                    <Link
                      href="/program/extracurricular"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Staff portal
                    </Link>
                    <Link
                      href="/program/extracurricular"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Student portal
                    </Link>
                    <Link
                      href="/program/extracurricular"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Parent portal
                    </Link>
                  </div>
                </div>

                {/* Alumni */}
                <div className="relative group">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    Alumni
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/alumni/network"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Alumni Network
                    </Link>
                    <Link
                      href="/alumni/events"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Alumni Events
                    </Link>
                  </div>
                </div>

                {/* Careers */}
                <div className="relative group">
                  <button
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      isScrolled ? "text-primary-green-text" : "text-white"
                    } font-medium`}
                  >
                    Careers
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70 mt-1.5" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t-2 border-primary-green">
                    <Link
                      href="/careers/teaching"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Teaching Positions
                    </Link>
                    <Link
                      href="/careers/administrative"
                      className="block px-4 py-2 text-sm text-primary-green-text hover:bg-gray-100"
                    >
                      Administrative Roles
                    </Link>
                  </div>
                </div>

                {/* Check results */}
                <Link
                  href="#"
                  className={`px-3 py-2 ${
                    isScrolled ? "text-primary-green-text" : "text-white"
                  } font-medium`}
                >
                  Check results
                </Link>

                {/* News */}
                <Link
                  href="/news"
                  className={`px-3 py-2 ${
                    isScrolled ? "text-primary-green-text" : "text-white"
                  } font-medium`}
                >
                  News
                </Link>
              </div>
            </div>

            {/* Enroll Now Button - Desktop */}
            <div className="hidden lg:block">
              <Link
                href="/enroll-now"
                className="bg-primary-green hover:bg-primary-green-hover text-white font-medium px-6 py-2 rounded-full transition-colors"
              >
                Enroll Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center justify-center gap-3 lg:hidden">
              <button
                className="lg:hidden text-gray-600"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu
                  className={isScrolled ? "text-gray-800" : "text-white"}
                  size={24}
                />
              </button>
              <small className={isScrolled ? "text-gray-800" : "text-white"}>
                MENU
              </small>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden overflow-scroll">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl z-50 transform transition-transform overflow-scroll">
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-end pb-3.5">
                <button
                  className="text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-1">
                    <X size={24} />
                    <small className="text-primary-green-text">CLOSE</small>
                  </div>
                </button>
              </div>

              {/* Logo */}
              <div
                className="flex items-center pb-3.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link
                  href="/"
                  className="text-xl font-bold flex items-center text-primary-green-text"
                >
                  <Image
                    src="/treasure.png"
                    alt="Treasureland Schools"
                    width={40}
                    height={40}
                    className="mr-2 rounded-full bg-gray-300"
                  />
                  <div className="flex flex-col">
                    <span className="text-primary-green-text hover:text-gray-700">
                      TREASURE LAND
                    </span>
                    <span className="text-primary-green-text hover:text-gray-700">
                      MODEL SCHOOL
                    </span>
                  </div>
                </Link>
              </div>

              <div className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>

                {/* Mobile Accordion Menus */}
                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setSchoolsOpen(!schoolsOpen)}
                  >
                    Schools
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        schoolsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {schoolsOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/about"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Primary School
                      </Link>
                      <Link
                        href="/about/team"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Secondary School
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setAboutOpen(!aboutOpen)}
                  >
                    About
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        aboutOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {aboutOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/about"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Our Story
                      </Link>
                      <Link
                        href="/about/team"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Our Team
                      </Link>
                      <Link
                        href="/about/facilities"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Facilities
                      </Link>
                      <Link
                        href="/program/curriculum"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Curriculum
                      </Link>
                      <Link
                        href="/program/extracurricular"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Extracurricular
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setEnrollOpen(!enrollOpen)}
                  >
                    Enroll
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        enrollOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {enrollOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/enroll/process"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Enrollment Process
                      </Link>
                      <Link
                        href="/enroll/requirements"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Requirements
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setProgramOpen(!programOpen)}
                  >
                    Portals
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        programOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {programOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/program/curriculum"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Portal
                      </Link>
                      <Link
                        href="/program/extracurricular"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Staff Portal
                      </Link>
                      <Link
                        href="/program/curriculum"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Student Portal
                      </Link>
                      <Link
                        href="/program/extracurricular"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Parent Portal
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setAlumniOpen(!alumniOpen)}
                  >
                    Alumini
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        alumniOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {alumniOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/about"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Alumni Network
                      </Link>
                      <Link
                        href="/about/team"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Alumni Events
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-primary-green-text hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
                    onClick={() => setCareersOpen(!careersOpen)}
                  >
                    Careers
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        careersOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {careersOpen && (
                    <div className="pl-6 py-2 space-y-2">
                      <Link
                        href="/careers/teaching"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Teaching Positions
                      </Link>
                      <Link
                        href="/careers/administrative"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Administrative Roles
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/news"
                  className="px-4 py-2 text-primary-green-text hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Check Results
                </Link>

                <Link
                  href="/news"
                  className="px-4 py-2 text-primary-green-text hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  News
                </Link>
              </div>

              <div className="mt-auto">
                <Link
                  href="/enroll-now"
                  className="w-full block text-center bg-primary-green hover:bg-primary-green-hover text-white font-medium px-6 py-3 rounded-full transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Slider */}
      <section className="relative h-[55vh] md:h-[80vh] lg:h-[120vh] ">
        {/* Background Slider */}
        {sliderImages.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.src})`,
              }}
            />
            <div className="absolute inset-0 bg-black opacity-25" />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center justify-center text-white px-6 lg:px-16">
          <div className="container mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="text-center lg:text-left max-w-2xl lg:max-w-3xl mx-auto lg:mx-0 pt-5 lg:pt-0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h1
                  className="text-4xl md:text-6xl font-bold lg:font-bold mb-6 leading-10 lg:leading-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {sliderImages[currentSlide].title}
                </motion.h1>
                <motion.p
                  className="text-base md:text-xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {sliderImages[currentSlide].description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-primary-green hover:bg-primary-green-hover rounded-full text-primary-foreground text-lg px-6 py-6 cursor-pointer group">
                    <span>Learn More</span>
                    <motion.span
                      className="inline-block ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowRight className="h-4 w-4 inline" />
                    </motion.span>
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/*End content*/}

        {/* Slider Controls */}

        <motion.button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Previous slide"
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Next slide"
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="h-6 w-6" />
        </motion.button>

        {/* Slide Indicators */}

        <div className="absolute bottom-8 lg:bottom-34 left-1/2 -translate-x-1/2 flex space-x-2 ">
          {sliderImages.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === index ? "bg-white w-8" : "bg-white/50 w-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={currentSlide === index ? { scale: [1, 1.1, 1] } : {}}
              transition={{
                duration: 1,
                repeat: currentSlide === index ? Number.POSITIVE_INFINITY : 0,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-4 z-10 mt-8 lg:relative lg:-mt-16">
        <motion.div
          className="max-w-5xl mx-auto bg-white rounded-xl lg:rounded-full shadow-none lg:shadow-lg overflow-hidden py-6 lg:py-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.7,
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
        >
          <div className="flex flex-col gap-10 md:gap-20 md:flex-row">
            <motion.div
              className="flex-1 p-2 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-r border-gray-200 pb-6 md:pb-0"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="flex items-center justify-center"
                whileHover={{
                  rotate: [0, -5, 5, -3, 3, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <Image
                  src="/useradd.png"
                  alt="Enroll Icon"
                  width={100}
                  height={100}
                />
              </motion.div>
              <motion.div
                className="flex md:flex-col items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.h3
                  className="text-primary-green-text text-xl md:text-2xl font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  Enroll
                </motion.h3>
                <motion.p
                  className="text-primary-green-text text-xl md:text-lg font-bold"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  With Us
                </motion.p>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex-1 p-2 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-r border-gray-200 pb-6 md:pb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="flex items-center justify-center"
                whileHover={{
                  rotate: [0, -5, 5, -3, 3, 0],
                  transition: {
                    duration: 0.5,
                    repeat: Infinity,
                  },
                }}
              >
                <Image
                  src="/employee.png"
                  alt="Teach Icon"
                  width={100}
                  height={100}
                />
              </motion.div>

              <motion.div
                className="flex md:flex-col items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.h3
                  className="text-primary-green-text text-xl md:text-2xl font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  Teach
                </motion.h3>
                <motion.p
                  className="text-primary-green-text text-xl md:text-lg font-bold"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  With Us
                </motion.p>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex-1 p-2 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="flex items-center justify-center"
                whileHover={{
                  rotate: [0, -5, 5, -3, 3, 0],
                  transition: { duration: 0.5, repeat: Infinity },
                }}
              >
                <Image
                  src="/graduate.png"
                  alt="Alumni Icon"
                  width={100}
                  height={100}
                />
              </motion.div>
              <motion.div
                className="flex md:flex-col items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.h3
                  className="text-primary-green-text text-xl md:text-2xl font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  Alumni
                </motion.h3>
                <motion.p
                  className="text-primary-green-text text-xl md:text-lg font-bold"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  & Beyond
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Mission Statement */}
      <motion.section
        className="py-16 px-4"
        ref={missionRef}
        initial={{ opacity: 0 }}
        animate={missionInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <motion.h1
            className="text-5xl font-extrabold text-primary-green mb-14 lg:mb-10 relative text-center leading-14 lg:leading-20"
            initial={{ opacity: 0, y: 20 }}
            animate={missionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Your Future is Bright!
            <motion.div
              className="absolute -bottom-2 left-0 w-full"
              initial={{ scaleX: 0 }}
              animate={missionInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <svg
                viewBox="0 0 400 20"
                className="w-full h-4 fill-none stroke-[#0066B3] stroke-[3]"
              >
                <motion.path
                  d="M 0 15 Q 100 5, 200 15 Q 300 25, 400 15"
                  className="stroke-primary-green"
                  initial={{ pathLength: 0 }}
                  animate={missionInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </svg>
            </motion.div>
          </motion.h1>
          <motion.p
            className="text-primary-green-text text-center max-w-3xl text-sm leading-8 lg:leading-relaxed lg:text-lg font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={missionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            At Treasure Land, we provide students with strong academics,
            holistic and inclusive support, and rich life opportunities beyond
            the classroom so they thrive from primary through secondary
            education... and far beyond!
          </motion.p>
        </div>
      </motion.section>
      {/* Featured Content */}
      <Features />
      {/* Join Our Family */}
      <JoinOurFamily />
      {/* News & Events */}
      <Events />
      {/* Testimonials */}
      <div className="min-h-screen">
        <TestimonialsSection
          title="What Our Community Says"
          description="Hear from our students, parents, and teachers about their experience at Treasure Land"
          testimonials={testimonials}
        />
      </div>
      {/* Call to Action */}
      <Call />
    </main>
  );
}
