import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-4">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between mb-12">
          {/* Logo and tagline */}
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/treasure.png"
                alt="Treasure Land Logo"
                width={50}
                height={50}
                className="object-contain bg-amber-50 rounded-full"
              />
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg">
                  TREASURE LAND
                </span>
                <span className="font-bold text-white text-sm">
                  MODEL SCHOOL
                </span>
              </div>
            </div>
            <p className="text-gray-400 max-w-md">
              Providing quality education to students in Okitipupa, Ondo State
              since 2005.
            </p>
          </div>

          {/* Social media icons */}
          <div className="flex gap-4 mb-8 md:mb-0 h-fit">
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-primary-green transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-primary-green transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-primary-green transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-primary-green transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
          {/* About column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              About Treasure Land
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Treasure Land School is a private educational institution that
              provides quality primary and secondary education with a focus on
              academic excellence, character development, and holistic growth.
            </p>
          </div>

          {/* Contact Us column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary-green mt-1 shrink-0" />
                <span className="text-gray-400">
                  123 School Road, Okitipupa, Ondo State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-green shrink-0" />
                <span className="text-gray-400">+234 803 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-green shrink-0" />
                <span className="text-gray-400">
                  info@treasurelandschool.edu.ng
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Links column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 grid grid-cols-1 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/admissions"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Admissions
                </Link>
              </li>
              <li>
                <Link
                  href="/academics"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Academics
                </Link>
              </li>
              <li>
                <Link
                  href="/facilities"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Facilities
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Events & Activities
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* E-Newsletter  */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">E-Newsletter</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
              />
              <Button className="w-full bg-primary-green hover:bg-primary-green/90 text-white font-medium text-sm py-2">
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-500 text-center md:text-left mb-2 md:mb-0">
            © {new Date().getFullYear()} Treasure Land Model School. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="https://isaacanyim-iota.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Website by{" "}
              <small className="font-bold underline text-primary-green">
                CreatorLZ
              </small>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
