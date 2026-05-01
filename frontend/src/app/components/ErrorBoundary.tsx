import { useRouteError, Link } from "react-router-dom";

export default function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
        <h1 className="text-3xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
          Oops!
        </h1>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Geist', fontSize: '15px' }}>
          {error?.message || "Something went wrong. Please try again."}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl transition-all hover:scale-105"
          style={{
            fontFamily: 'Geist',
            fontSize: '15px',
            fontWeight: 500,
            boxShadow: 'inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
