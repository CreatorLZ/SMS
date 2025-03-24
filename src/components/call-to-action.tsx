import React from "react";
import { Button } from "./ui/button";

const Call = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className=" font-bold text-primary-green text-3xl pb-3.5 leading-tight sm:text-5xl sm:leading-tight">
          Ready To Join Treasure Land?
        </h2>
        <p className="text-lg mb-8 text-primary-green-text text-center">
          Take the first step towards providing your child with quality
          education and a bright future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-primary-green text-primary-foreground hover:bg-primary-green-hover text-lg px-6 py-3 cursor-pointer border-t-primary-green-text">
            Enroll Now
          </Button>
          <Button
            variant="outline"
            className="text-lg px-6 py-3 text-primary-green-text cursor-pointer"
          >
            Schedule a Visit
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Call;
