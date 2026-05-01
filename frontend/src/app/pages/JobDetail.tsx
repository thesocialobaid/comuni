import { useEffect, useState } from "react";
import { motion } from "framer-motion"; // Or "motion/react" if using the specific alpha/beta build
import { Link, useParams } from "react-router-dom"; // Changed from "react-router"
import { DollarSign, Users, Calendar, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { jobsAPI } from "@/api/jobs";

export default function JobDetail() {
  const { id } = useParams();

  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const data = await jobsAPI.getById(id!);
        setJobData(data);
      } catch (err) {
        console.error("Failed to load job");
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id]);

  if (loading || !jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading job...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            style={{ fontFamily: 'Geist', fontSize: '14px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mb-6"
              >
                <h1 className="text-3xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {jobData.title}
                </h1>

                <p className="text-gray-700 whitespace-pre-line" style={{ fontFamily: 'Geist', fontSize: '15px', lineHeight: '1.7' }}>
                  {jobData.description}
                </p>
              </motion.div>

              {/* Skills */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mb-6">
                <h3 className="text-xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  Required Skills
                </h3>

                <div className="space-y-3">
                  {jobData.skills?.map((skill: any) => (
                    <div key={skill.name} className="flex items-center gap-3">
                      {skill.required ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}

                      <span style={{ fontFamily: 'Geist' }}>
                        {skill.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  Employer Reviews
                </h3>

                <div className="space-y-6">
                  {jobData.reviews?.map((review: any) => (
                    <div key={review.id}>
                      <p style={{ fontFamily: 'Geist' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (UNCHANGED STRUCTURE) */}
            <div className="col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 sticky top-24">

                <p className="text-3xl mb-6" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {jobData.budget}
                </p>

                <button className="w-full py-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl">
                  Apply Now
                </button>

                <div className="mt-6 space-y-3">
                  <div>
                    <span>Status:</span> {jobData.status}
                  </div>
                  <div>
                    <span>Applicants:</span> {jobData.applicants}
                  </div>
                  <div>
                    <span>Deadline:</span> {jobData.deadline}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}