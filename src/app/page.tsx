"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Features } from "./features";
import Events from "@/components/events";
import Call from "@/components/call-to-action";
import { TestimonialsSection } from "@/components/testimonials-with-marquee";

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
    title: "Modern Learning Environment",
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
      avatar: "/testimonials/parent1.jpg",
    },
    text: "Treasure Land has provided my children with an exceptional education. The teachers are dedicated and the environment nurtures both academic excellence and personal growth.",
  },
  {
    author: {
      name: "Mr. David Chen",
      handle: "Science Teacher",
      avatar: "/testimonials/teacher1.jpg",
    },
    text: "Teaching at Treasure Land is truly rewarding. The school's commitment to innovation and student development creates an inspiring learning environment for both students and teachers.",
  },
  {
    author: {
      name: "Michael Adebayo",
      handle: "Grade 12 Student",
      avatar: "/testimonials/student1.jpg",
    },
    text: "The opportunities I've had at Treasure Land have been amazing. From the science club to leadership programs, I've grown so much as a person and student.",
  },
  {
    author: {
      name: "Mrs. Patricia Okonjo",
      handle: "Parent",
      avatar: "/testimonials/parent2.jpg",
    },
    text: "The individual attention and care each student receives at Treasure Land is remarkable. My daughter has flourished academically and socially since joining.",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length
    );
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
        style={{
          backdropFilter: isScrolled ? "none" : "blur(10px)",
          backgroundColor: isScrolled ? "white" : "rgba(255, 255, 255, 0.1)",
        }}
      >
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
                  className="mr-2"
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-bold text-sm",
                      isScrolled ? "text-gray-800" : "text-white"
                    )}
                  >
                    TREASURE LAND
                  </span>
                  <span
                    className={cn(
                      "font-bold text-sm",
                      isScrolled ? "text-gray-800" : "text-white"
                    )}
                  >
                    MODEL SCHOOL
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-md font-medium ${
                  isScrolled
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                } transition-colors`}
              >
                Home
              </Link>
              <div className="relative group">
                <button
                  className={`px-4 py-2 rounded-md font-medium flex items-center ${
                    isScrolled
                      ? "text-gray-800 hover:bg-gray-100"
                      : "text-white hover:bg-white/10"
                  } transition-colors`}
                >
                  About <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Our Story
                  </Link>
                  <Link
                    href="/about/team"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Our Team
                  </Link>
                  <Link
                    href="/about/facilities"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Facilities
                  </Link>
                </div>
              </div>
              <div className="relative group">
                <button
                  className={`px-4 py-2 rounded-md font-medium flex items-center ${
                    isScrolled
                      ? "text-gray-800 hover:bg-gray-100"
                      : "text-white hover:bg-white/10"
                  } transition-colors`}
                >
                  Enroll <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    href="/enroll/process"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Enrollment Process
                  </Link>
                  <Link
                    href="/enroll/requirements"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Requirements
                  </Link>
                </div>
              </div>
              <Link
                href="/programs"
                className={`px-4 py-2 rounded-md font-medium ${
                  isScrolled
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                } transition-colors`}
              >
                Programs
              </Link>
              <Link
                href="/alumni"
                className={`px-4 py-2 rounded-md font-medium ${
                  isScrolled
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                } transition-colors`}
              >
                Alumni
              </Link>
              <Link
                href="/careers"
                className={`px-4 py-2 rounded-md font-medium ${
                  isScrolled
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                } transition-colors`}
              >
                Careers
              </Link>
              <Link
                href="/news"
                className={`px-4 py-2 rounded-md font-medium ${
                  isScrolled
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                } transition-colors`}
              >
                News
              </Link>
            </div>

            {/* Enroll Now Button - Desktop */}
            <div className="hidden md:block">
              <Link
                href="/enroll-now"
                className="bg-primary-green hover:bg-primary-green-hover text-white font-medium px-6 py-2 rounded-full transition-colors"
              >
                Enroll Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu
                className={isScrolled ? "text-gray-800" : "text-white"}
                size={24}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl z-50 transform transition-transform">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="text-2xl font-bold">Treasure Land</div>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={24} />
                </button>
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
                    className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
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
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 rounded-md font-medium flex items-center justify-between"
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

                <Link
                  href="/programs"
                  className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Programs
                </Link>
                <Link
                  href="/alumni"
                  className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Alumni
                </Link>
                <Link
                  href="/careers"
                  className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Careers
                </Link>
                <Link
                  href="/news"
                  className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md font-medium"
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
      <section className="relative h-screen">
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
            <div className="absolute inset-0 bg-black opacity-50" />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center justify-center text-white px-6 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center lg:text-left max-w-2xl lg:max-w-3xl mx-auto lg:mx-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {sliderImages[currentSlide].title}
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                {sliderImages[currentSlide].description}
              </p>
              <Button className="bg-primary-green hover:bg-primary-green-hover rounded-full text-primary-foreground  text-lg px-6 py-6 l cursor-pointer">
                Learn More
              </Button>
            </div>
          </div>
        </div>
        {/*End content*/}

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 lg:bottom-28 left-1/2 -translate-x-1/2 flex space-x-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? "bg-white w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="relative lg:-mt-16 px-4 z-10">
        <div className="max-w-5xl mx-auto bg-white lg:rounded-full lg:shadow-lg overflow-hidden py-8 ">
          <div className="flex flex-col gap-20 md:flex-row ">
            <div className="flex-1 p-0 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-b-0 md:border-r md:border-gray-200">
              <div className=" flex items-center justify-center ">
                <Image
                  src="/enroll.svg"
                  alt="Enroll Icon"
                  width={100}
                  height={100}
                />
              </div>
              <div className=" flex md:flex-col items-center justify-center gap-1">
                <h3 className="text-black text-xl md:text-2xl font-bold ">
                  Enroll
                </h3>
                <p className="text-black text-xl md:text-lg font-bold ">
                  With Us
                </p>
              </div>
            </div>
            <div className="flex-1 p-0 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-b-0 md:border-r md:border-gray-200">
              <div className=" flex items-center justify-center ">
                <Image
                  src="/teach.svg"
                  alt="Teach Icon"
                  width={100}
                  height={100}
                />
              </div>

              <div className=" flex md:flex-col items-center justify-center gap-1">
                <h3 className="text-black text-xl md:text-2xl font-bold ">
                  Teach
                </h3>
                <p className="text-black text-xl md:text-lg font-bold ">
                  With Us
                </p>
              </div>
            </div>
            <div className="flex-1 p-0 flex flex-col md:flex-row gap-3 items-center justify-center text-center md:border-b-0 md:border-r md:border-gray-200">
              <div className=" flex items-center justify-center ">
                <Image
                  src="/alumini.svg"
                  alt="Alumini Icon"
                  width={100}
                  height={100}
                />
              </div>
              <div className=" flex md:flex-col items-center justify-center gap-1">
                <h3 className="text-black text-xl md:text-2xl font-bold ">
                  Alumini
                </h3>
                <p className="text-black text-xl md:text-lg font-bold ">
                  & Beyond
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className=" flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-bold text-primary-green mb-6 relative text-center">
            Your Future is Bright!
            <div className="absolute -bottom-2 left-0 w-full">
              <svg
                viewBox="0 0 400 20"
                className="w-full h-4 fill-none stroke-[#0066B3] stroke-[3]"
              >
                <path
                  d="M 0 15 Q 100 5, 200 15 Q 300 25, 400 15"
                  className="stroke-primary-green"
                />
              </svg>
            </div>
          </h1>
          <p className="text-muted-foreground text-center max-w-3xl text-lg font-bold">
            At Treasure Land, we provide students with strong academics,
            holistic and inclusive support, and rich life opportunities beyond
            the classroom so they thrive from primary through secondary
            education... and far beyond!
          </p>
        </div>
      </section>
      {/* Featured Content */}
      <Features />
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
