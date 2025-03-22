import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  TestimonialCard,
  TestimonialAuthor,
} from "@/components/ui/testimonial-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialsSectionProps {
  title: string;
  description: string;
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
}

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((index: number) => {
    if (!containerRef.current) return;
    setIsAutoScrolling(false);
    const cardWidth =
      containerRef.current.querySelector("[data-testimonial]")?.clientWidth ??
      0;
    const gap = 24; // 6 * 4px (gap-6)
    containerRef.current.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });
    setCurrentIndex(index);
  }, []);

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollTo(newIndex);
  }, [currentIndex, scrollTo]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(testimonials.length - 1, currentIndex + 1);
    scrollTo(newIndex);
  }, [currentIndex, testimonials.length, scrollTo]);

  return (
    <section
      className={cn(
        "bg-background text-foreground w-full",
        "py-12 sm:py-24 md:py-32",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] font-bold text-primary-green text-3xl  leading-tight sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative w-full overflow-hidden px-4">
          <div ref={containerRef} className="flex w-full overflow-x-hidden">
            <div
              className={cn(
                "flex gap-6",
                isAutoScrolling &&
                  "animate-marquee hover:[animation-play-state:paused]"
              )}
              style={{
                willChange: "transform",
                minWidth: "max-content",
              }}
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex gap-6">
                  {testimonials.map((testimonial, i) => (
                    <TestimonialCard
                      key={`${setIndex}-${i}`}
                      {...testimonial}
                      data-testimonial
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />

          <div className="absolute inset-y-0 left-4 flex items-center">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={cn(
                "rounded-full p-2 text-foreground/80 hover:bg-accent hover:text-foreground",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous testimonial</span>
            </button>
          </div>

          <div className="absolute inset-y-0 right-4 flex items-center">
            <button
              onClick={handleNext}
              disabled={currentIndex === testimonials.length - 1}
              className={cn(
                "rounded-full p-2 text-foreground/80 hover:bg-accent hover:text-foreground",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next testimonial</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                currentIndex === index
                  ? "bg-foreground w-4"
                  : "bg-foreground/20 hover:bg-foreground/40"
              )}
            >
              <span className="sr-only">Go to testimonial {index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
