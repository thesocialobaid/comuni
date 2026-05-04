import { request } from "../../api/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { DollarSign, Users, Calendar, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { jobsAPI } from "../../api/jobs";

// ── Star rating helper ─────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${
            n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface JobReview {
  reviewId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerId: number;
  revieweeName: string;
  revieweeId: number;
}

export default function JobDetail() {
  const { id } = useParams();

  const [jobData, setJobData]           = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [applying, setApplying]         = useState(false);
  const [applied, setApplied]           = useState(false);
  const [applyError, setApplyError]     = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [applicants, setApplicants]     = useState<any[]>([]);

  // ── Review state ──────────────────────────────────────────────────────────
  const [jobReviews, setJobReviews]         = useState<JobReview[]>([]);
  const [reviewRating, setReviewRating]     = useState(0);
  const [reviewComment, setReviewComment]   = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError]       = useState("");
  const [reviewSuccess, setReviewSuccess]   = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // ── Fetch job ─────────────────────────────────────────────────────────────
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

  // ── Fetch current user ────────────────────────────────────────────────────
  useEffect(() => {
    request("/auth/me")
      .then((res: any) => setCurrentUserId(res.student?.studentId))
      .catch(() => {});
  }, []);

  // ── Fetch applicants (poster only) ────────────────────────────────────────
  useEffect(() => {
    if (!jobData || !currentUserId) return;
    if (currentUserId !== jobData.postedBy) return;
    request(`/jobs/${id}/applications`)
      .then((res: any) => {
        const list = res.ranked ?? res.applications ?? [];
        setApplicants(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [jobData, currentUserId]);

  // ── Fetch existing reviews for this job ───────────────────────────────────
  useEffect(() => {
    if (!id) return;
    request(`/jobs/${id}/reviews`)
      .then((res: any) => {
        const reviews: JobReview[] = res.reviews ?? [];
        setJobReviews(reviews);
        // Check if current user already left a review
        if (currentUserId && reviews.some((r) => r.reviewerId === currentUserId)) {
          setAlreadyReviewed(true);
        }
      })
      .catch(() => {});
  }, [id, currentUserId]);

  // ── Apply handler ─────────────────────────────────────────────────────────
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

  // ── Submit review handler ─────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError("Please select a rating.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    try {
      await request(`/jobs/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      setReviewSuccess(true);
      setAlreadyReviewed(true);
      // Refresh reviews list
      const res: any = await request(`/jobs/${id}/reviews`);
      setJobReviews(res.reviews ?? []);
    } catch (err: any) {
      if (err.message?.includes("already reviewed") || err.status === 409) {
        setAlreadyReviewed(true);
        setReviewError("You have already reviewed this job.");
      } else {
        setReviewError(err.message || "Failed to submit review.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading job...</p>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const isCompleted   = jobData.status === "COMPLETED";
  const isPoster      = currentUserId === jobData.postedBy;
  const isWorker      = currentUserId === jobData.assignedTo;
  // Both poster and assigned worker can leave a review after completion
  const canReview     = isCompleted && (isPoster || isWorker) && !alreadyReviewed;

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
            style={{ fontFamily: "Geist", fontSize: "14px" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <div className="grid grid-cols-3 gap-6">
            {/* ── LEFT / MAIN COLUMN ─────────────────────────────────────── */}
            <div className="col-span-2">

              {/* Job title & description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mb-6"
              >
                <h1 className="text-3xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                  {jobData.title}
                </h1>
                <p
                  className="text-gray-700 whitespace-pre-line"
                  style={{ fontFamily: "Geist", fontSize: "15px", lineHeight: "1.7" }}
                >
                  {jobData.description}
                </p>
              </motion.div>

              {/* Skills */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mb-6">
                <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
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
                      <span style={{ fontFamily: "Geist" }}>{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Leave a Review — only when COMPLETED and user was a party ── */}
              {isCompleted && currentUserId && (isPoster || isWorker) && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mb-6">
                  <h3
                    className="text-xl mb-2 flex items-center gap-2"
                    style={{ fontFamily: "Geist", fontWeight: 600 }}
                  >
                    <Star className="w-5 h-5" />
                    {alreadyReviewed ? "Your Review" : "Leave a Review"}
                  </h3>

                  {/* Context — who are you reviewing */}
                  {!alreadyReviewed && !reviewSuccess && (
                    <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "Geist" }}>
                      {isPoster
                        ? <>You're rating <span className="font-medium text-gray-800">{jobData.workerName}</span> as the worker on this job.</>
                        : <>You're rating <span className="font-medium text-gray-800">{jobData.posterName}</span> as the job poster.</>
                      }
                    </p>
                  )}

                  {reviewSuccess ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p
                        className="text-green-700 text-sm"
                        style={{ fontFamily: "Geist", fontWeight: 500 }}
                      >
                        Review submitted successfully!
                      </p>
                    </div>
                  ) : alreadyReviewed ? (
                    <p
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: "Geist" }}
                    >
                      You have already reviewed this job.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Star picker */}
                      <div>
                        <p
                          className="text-sm text-gray-600 mb-2"
                          style={{ fontFamily: "Geist", fontWeight: 500 }}
                        >
                          Rating <span className="text-red-400">*</span>
                        </p>
                        <StarPicker value={reviewRating} onChange={setReviewRating} />
                      </div>

                      {/* Comment */}
                      <div>
                        <p
                          className="text-sm text-gray-600 mb-2"
                          style={{ fontFamily: "Geist", fontWeight: 500 }}
                        >
                          Comment <span className="text-gray-400">(optional)</span>
                        </p>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder={
                            isPoster
                              ? `How was ${jobData.workerName}'s work?`
                              : `How was it working with ${jobData.posterName}?`
                          }
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                          style={{ fontFamily: "Geist" }}
                        />
                      </div>

                      {reviewError && (
                        <p
                          className="text-red-500 text-sm"
                          style={{ fontFamily: "Geist" }}
                        >
                          {reviewError}
                        </p>
                      )}

                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || reviewRating === 0}
                        className="px-6 py-2.5 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl text-sm hover:from-[#333] hover:to-[#222] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "Geist", fontWeight: 500 }}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Reviews for this job ───────────────────────────────────── */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200">
                <h3
                  className="text-xl mb-6 flex items-center gap-2"
                  style={{ fontFamily: "Geist", fontWeight: 600 }}
                >
                  <Star className="w-5 h-5" /> Reviews ({jobReviews.length})
                </h3>

                {jobReviews.length === 0 ? (
                  <p
                    className="text-center text-gray-400 py-6"
                    style={{ fontFamily: "Geist", fontSize: "14px" }}
                  >
                    {isCompleted
                      ? "No reviews yet. Be the first to leave one above."
                      : "Reviews can be submitted once the job is completed."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {jobReviews.map((review) => (
                      <motion.div
                        key={review.reviewId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-gray-50 border border-gray-200 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span
                                style={{
                                  fontFamily: "Geist",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                }}
                              >
                                {review.reviewerName?.[0] ?? "?"}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}>
                                {review.reviewerName}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "Geist" }}>
                                reviewed {review.revieweeName} ·{" "}
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <StarDisplay value={review.rating} />
                        </div>

                        {review.comment && (
                          <p
                            className="text-gray-700 text-sm"
                            style={{ fontFamily: "Geist", lineHeight: "1.6" }}
                          >
                            {review.comment}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Applicants — only visible to job poster ───────────────── */}
              {isPoster && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 mt-6">
                  <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    Applicants ({applicants.length})
                  </h3>
                  {applicants.length === 0 ? (
                    <p className="text-gray-400 text-sm" style={{ fontFamily: "Geist" }}>
                      No applicants yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {applicants.map((app: any) => (
                        <div
                          key={app.applicationId}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                        >
                          <Link
                            to={`/students/${app.applicantId}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                              <span
                                className="text-white text-sm"
                                style={{ fontFamily: "Geist", fontWeight: 600 }}
                              >
                                {app.name?.[0] ?? "?"}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontFamily: "Geist", fontWeight: 500 }}>{app.name}</p>
                              <p className="text-gray-500 text-xs" style={{ fontFamily: "Geist" }}>
                                {app.email}
                              </p>
                            </div>
                          </Link>

                          <div className="flex items-center gap-3">
                            {app.status !== "accepted" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await request(
                                      `/jobs/${id}/applications/${app.applicationId}/accept`,
                                      { method: "PATCH" }
                                    );
                                    setApplicants((prev) =>
                                      prev.map((a: any) =>
                                        a.applicationId === app.applicationId
                                          ? { ...a, status: "accepted" }
                                          : a
                                      )
                                    );
                                  } catch {}
                                }}
                                className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-700 transition-colors"
                                style={{ fontFamily: "Geist", fontWeight: 500 }}
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

            {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
            <div className="col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 sticky top-24">
                <p className="text-3xl mb-6" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                  {jobData.budget}
                </p>

                {!isPoster && currentUserId && (
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
                      <p
                        className="mt-2 text-red-500 text-sm text-center"
                        style={{ fontFamily: "Geist" }}
                      >
                        {applyError}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-6 space-y-3">
                  <div>
                    <span style={{ fontFamily: "Geist", fontWeight: 500 }}>Status: </span>
                    <span
                      className={`text-sm ${
                        jobData.status === "COMPLETED"
                          ? "text-green-600"
                          : jobData.status === "IN_PROGRESS"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                      style={{ fontFamily: "Geist" }}
                    >
                      {jobData.status}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "Geist", fontWeight: 500 }}>Applicants: </span>
                    <span style={{ fontFamily: "Geist" }}>{jobData.applicants}</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "Geist", fontWeight: 500 }}>Deadline: </span>
                    <span style={{ fontFamily: "Geist" }}>{jobData.deadline}</span>
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