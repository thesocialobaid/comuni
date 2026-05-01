import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover [transform:scaleY(-1)]"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-[rgba(255,255,255,0)] to-[66.943%] to-white"></div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-[1200px] flex flex-col gap-8" style={{ paddingTop: '290px' }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
            style={{ fontFamily: 'Geist', fontWeight: 500, letterSpacing: '-0.04em' }}
          >
            <span style={{ fontSize: '80px', lineHeight: '1' }}>
              Simple{' '}
            </span>
            <span
              style={{
                fontFamily: 'Instrument Serif',
                fontStyle: 'italic',
                fontSize: '100px',
                lineHeight: '1',
              }}
            >
              freelancing
            </span>
            <br />
            <span style={{ fontSize: '80px', lineHeight: '1' }}>
              for FAST students
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mx-auto"
            style={{
              fontFamily: 'Geist',
              fontSize: '18px',
              opacity: 0.8,
              color: '#373a46',
              maxWidth: '554px',
            }}
          >
            Connect with talented FAST students for your projects. Find freelance opportunities, build your portfolio, and grow your career.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="flex items-center gap-2 bg-[#fcfcfc] border border-gray-200 px-6 py-3 w-full max-w-[500px]"
              style={{
                borderRadius: '40px',
                boxShadow: '0px 10px 40px 5px rgba(194,194,194,0.25)',
              }}
            >
              <input
                type="email"
                placeholder="Enter your FAST email"
                className="flex-1 bg-transparent outline-none text-[15px]"
                style={{ fontFamily: 'Geist' }}
              />
              <Link to="/signup">
                <button
                  className="px-8 py-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-full transition-all hover:scale-105"
                  style={{
                    fontFamily: 'Geist',
                    fontSize: '15px',
                    fontWeight: 500,
                    boxShadow: 'inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)',
                  }}
                >
                  Create Free Account
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-2" style={{ fontFamily: 'Geist', fontSize: '14px', color: '#666' }}>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>1,020+ Reviews</span>
            </div>

            <div className="mt-4 text-center">
              <span style={{ fontFamily: 'Geist', fontSize: '14px', color: '#666' }}>
                Already have an account?{' '}
                <Link to="/login" className="text-[#2a2a2a] font-medium hover:underline">
                  Sign in
                </Link>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
