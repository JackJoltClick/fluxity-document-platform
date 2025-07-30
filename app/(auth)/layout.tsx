export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">Fluxity</h1>
          <p className="text-base text-gray-500 font-light mt-2">Document Intelligence Platform</p>
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-12 px-8 shadow-sm border border-gray-100 sm:rounded-lg sm:px-12">
          {children}
        </div>
      </div>
    </div>
  )
}