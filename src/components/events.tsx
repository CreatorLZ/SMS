import Image from "next/image";
import Link from "next/link";
import React from "react";

const Events = () => {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4 px-1 sm:gap-8 mb-10">
          <h2 className="max-w-[720px] font-bold text-primary-green text-3xl  leading-tight sm:text-5xl sm:leading-tight">
            Latest News & Updates
          </h2>
          <p className="text-md max-w-[600px] font-medium text-primary-green-text sm:text-xl text-center">
            Check out what's been going on at Treasure Land
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border rounded-lg overflow-hidden cursor-pointer hover:scale-105">
            <div className="h-48 relative">
              <Image
                src="/graduation2.jpg"
                alt="School Event"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 cursor-pointer">
              <div className="text-sm text-gray-500 mb-2">March 15, 2024</div>
              <h3 className="font-bold mb-2 ">Annual Science Fair</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                Students showcase their innovative science projects at our
                annual science fair.
              </p>
              <Link
                href="#"
                className="text-primary hover:underline font-medium"
              >
                Read More
              </Link>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden cursor-pointer hover:scale-105">
            <div className="h-48 relative">
              <Image
                src="/outdoor.jpg"
                alt="Sports Day"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-2">March 10, 2024</div>
              <h3 className="font-bold mb-2">Inter-House Sports Competition</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                Students compete in various athletic events during our annual
                inter-house sports day.
              </p>
              <Link
                href="/#"
                className="text-primary hover:underline font-medium"
              >
                Read More
              </Link>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden cursor-pointer hover:scale-105">
            <div className="h-48 relative">
              <Image
                src="/culture.jpg"
                alt="Cultural Day"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-2">
                February 28, 2024
              </div>
              <h3 className="font-bold mb-2">Cultural Day Celebration</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                Students celebrate Nigeria's rich cultural heritage through
                performances, food, and traditional attire.
              </p>
              <Link
                href="/#"
                className="text-primary hover:underline font-medium"
              >
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
