import { request } from "../../api/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion"; // Or "motion/react" if using the specific alpha/beta build
import { Link, useParams } from "react-router-dom"; // Changed from "react-router"
import { DollarSign, Users, Calendar, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { jobsAPI } from "../../api/jobs";

export default function JobDetail() {
  const { id } = useParams();

  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
const [applied, setApplied] = useState(false);
const [applyError, setApplyError] = useState("");
const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
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

  useEffect(() => {
    request("/auth/me")
      .then((res: any) => setCurrentUserId(res.student?.studentId))
      .catch(() => {});
  }, []);

useEffect(() => {
  console.log("applicants effect:", currentUserId, jobData?.postedBy);
  if (!jobData || !currentUserId) return;
  if (currentUserId !== jobData.postedBy) return;
  console.log("fetching applications for job id:", id);
  request(`/jobs/${id}/applications`)
    .then((res: any) => {
      console.log("applications response:", res);
      const list = res.ranked ?? res.applications ?? [];
      setApplicants(Array.isArray(list) ? list : []);
    })
    .catch(() => {});
}, [jobData, currentUserId]);


   const handleApply = async () => {
  setApplying(true);
  setApplyError("");
  try {
    await request(`/jobs/${id}/apply`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setApplied(true);
  } catch (err: any) {
    setApplyError(err.message || "Failed to apply");
  } finally {
    setApplying(false);
  }
};

  if (loading || !jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading job...</p>
      </div>
    );
  }

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
                      <p style={{ fontFamily: 'Geist' }}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicants — only visible to job poster */}
              {currentUserId === jobData.postedBy && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mt-6">
                  <h3 className="text-xl mb-4" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                    Applicants ({applicants.length})
                  </h3>
                  {applicants.length === 0 ? (
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Geist' }}>
                      No applicants yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {applicants.map((app: any) => (
                        <div key={app.applicationId} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                          <Link to={`/students/${app.applicantId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
    <span className="text-white text-sm" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
      {app.name?.[0] ?? "?"}
    </span>
  </div>
  <div>
    <p style={{ fontFamily: 'Geist', fontWeight: 500 }}>{app.name}</p>
    <p className="text-gray-500 text-xs" style={{ fontFamily: 'Geist' }}>{app.email}</p>
  </div>
</Link>
                          <div className="flex items-center gap-3">
                            
                            {app.status !== 'accepted'  && (
                              <button
  onClick={async () => {
    try {
      await request(`/jobs/${id}/applications/${app.applicationId}/accept`, { method: 'PATCH' });
      setApplicants(prev => prev.map((a: any) =>
        a.applicationId === app.applicationId ? { ...a, status: 'accepted' } : a
      ));
    } catch {}
  }}
  className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-700 transition-colors"
  style={{ fontFamily: 'Geist', fontWeight: 500 }}
>
  Accept
</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 sticky top-24">
                <p className="text-3xl mb-6" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                  {jobData.budget}
                </p>

                {currentUserId !== jobData.postedBy && (
                  <>
                    <button
                      onClick={handleApply}
                      disabled={applying || applied}
                      className={`w-full py-4 rounded-xl text-white transition-all ${
                        applied
                          ? "bg-green-600"
                          : "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222]"
                      }`}
                      style={{ fontFamily: "Geist", fontWeight: 500 }}
                    >
                      {applying ? "Applying..." : applied ? "Applied!" : "Apply Now"}
                    </button>
                    {applyError && (
                      <p className="mt-2 text-red-500 text-sm text-center" style={{ fontFamily: "Geist" }}>
                        {applyError}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-6 space-y-3">
                  <div><span>Status:</span> {jobData.status}</div>
                  <div><span>Applicants:</span> {jobData.applicants}</div>
                  <div><span>Deadline:</span> {jobData.deadline}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}