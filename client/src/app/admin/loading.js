export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="hidden border-r bg-gray-900/5 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto lg:bg-gray-50">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 py-6">
            {/* Logo Skeleton */}
            <div className="flex h-16 shrink-0 items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Navigation Skeleton */}
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li className="space-y-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="group relative flex rounded-md p-2 text-sm leading-6 font-semibold"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="ml-3 h-6 bg-gray-200 rounded flex-1 animate-pulse"></div>
                    </div>
                  ))}
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <main className="py-8">
            <div className="px-4 sm:px-6 lg:px-8">
              {/* Header Skeleton */}
              <div className="mb-8">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Content Loading Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
                  >
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="ml-4 h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="mt-2 h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="mt-1 h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Main Table/Content Skeleton */}
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
