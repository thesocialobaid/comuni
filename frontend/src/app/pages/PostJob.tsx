import { motion } from "motion/react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";

export default function PostJob() {
  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200"
          >
            <h1 className="text-3xl mb-6" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
              Post a Job
            </h1>
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Geist', fontSize: '15px' }}>
              Coming soon...
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
