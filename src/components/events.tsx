import Image from "next/image";
import Link from "next/link";
import React from "react";

const Events = () => {
  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-green">
            Latest News & Events
          </h2>
          <Link
            href="/#"
            className=" hover:underline font-medium text-primary-green"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-48 relative">
              <Image
                src="/graduation2.jpg"
                alt="School Event"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-2">March 15, 2024</div>
              <h3 className="font-bold mb-2">Annual Science Fair</h3>
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
          <div className="border rounded-lg overflow-hidden">
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
          <div className="border rounded-lg overflow-hidden">
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
