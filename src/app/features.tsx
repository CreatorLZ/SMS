"use client";

import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    title: "Strong Academics",
    description:
      "Our curriculum is designed to challenge students and prepare them for future academic success with a focus on core subjects and critical thinking.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14v7"
        />
      </svg>
    ),
    imageSrc: "/students.jpg",
    link: "/academics",
    overlayColor: "blue",
  },
  {
    title: "Talented Teachers",
    description:
      "Our dedicated faculty brings years of experience and passion to inspire every student to reach their full potential.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    imageSrc: "/class.jpg",
    link: "/faculty",
    overlayColor: "red",
  },
  {
    title: "Dedicated Counselors",
    description:
      "Every student has access to counselors who know them and their dreams, providing guidance for academic and personal growth.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    imageSrc: "/counsellor.jpg",
    link: "/counseling",
    overlayColor: "pink",
  },
  {
    title: "Modern Facilities",
    description:
      "Our campus features modern classrooms, laboratories, libraries, and technology to enhance the learning experience.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    imageSrc: "/classroom.jpg",
    link: "/facilities",
    overlayColor: "amber",
  },
  {
    title: "Sports Excellence",
    description:
      "We offer comprehensive sports programs that develop teamwork, discipline, and physical fitness.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
    imageSrc: "/sports.jpg",
    link: "/sports",
    overlayColor: "emrald",
  },
  {
    title: "Creative Arts",
    description:
      "Our arts programs encourage self-expression, creativity, and cultural appreciation through music, drama, and visual arts.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="white"
        className="h-10 w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
    imageSrc: "/art.jpg",
    link: "/arts",
    overlayColor: "orange",
  },
];

export function Features() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:px-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              icon={feature.icon}
              imageSrc={feature.imageSrc}
              description={feature.description}
              link={feature.link}
              overlayColor={feature.overlayColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
