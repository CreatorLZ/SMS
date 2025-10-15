"use client";

const TeachersLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="animate-pulse">
        <img
          src="/treasure.png"
          alt="Treasure Land Logo"
          className="h-32 w-auto mb-8 drop-shadow-lg"
        />
      </div>
      <div
        className="flex justify-center space-x-3"
        aria-label="Loading animation"
      >
        <div
          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.15s" }}
        ></div>
        <div
          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.45s" }}
        ></div>
      </div>
    </div>
  );
};

export default TeachersLoading;
