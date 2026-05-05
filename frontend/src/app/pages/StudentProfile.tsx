import { request } from "../../api/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Briefcase, Star, User, Calendar,
  Award, TrendingUp, FileText, Clock, DollarSign,
  X, Loader2, AlertCircle, Check, ShieldCheck,
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// ─── Types matching backend exactly ──────────────────────────────────────────
interface StudentData {
  studentId: number;
  rollNumber: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  workerRating: number;
  workerRatingCount: number;
  giverRating: number;
  giverRatingCount: number;
  jobsPostedCount: number;
  jobsCompletedCount: number;
  totalVouchCount: number;
  verifiedReviewer: boolean;
  completionRate: number;
  createdAt: string;
  skills: SkillData[];
}

interface SkillData {
  studentSkillId: number;
  skillId: string;
  skillName: string;
  category: string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  relevantComp: number;
  addedAt: string;
}

interface VouchData {
  vouchId: number;
  comment: string | null;
  createdAt: string;
  voucherName: string;
  voucherId: number;
  skillName: string | null;
  skillId: string | null;
}

interface ReviewData {
  reviewId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  jobTitle: string;
  jobId: number;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
const getLevelColor = (level: string) => {
  switch (level) {
    case "EXPERT":       return "bg-green-100 text-green-700 border-green-200";
    case "ADVANCED":     return "bg-blue-100 text-blue-700 border-blue-200";
    case "INTERMEDIATE": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:             return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case "EXPERT":       return "Expert";
    case "ADVANCED":     return "Advanced";
    case "INTERMEDIATE": return "Intermediate";
    default:             return "Beginner";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":        return "bg-green-100 text-green-700 border-green-200";
    case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "COMPLETED":   return "bg-gray-100 text-gray-700 border-gray-200";
    case "CANCELLED":   return "bg-red-100 text-red-700 border-red-200";
    default:            return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ value, size = "w-5 h-5" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// ─── Vouch Modal ──────────────────────────────────────────────────────────────
// POST /api/vouches — Body: { voucheeId, comment? }
// Only verifiedReviewer students (3+ completed jobs) can vouch
function VouchModal({
  student,
  onClose,
  onSuccess,
}: {
  student: StudentData;
  onClose: () => void;
  onSuccess: (vouchId: number) => void;
}) {
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await request("/vouches", {
        method: "POST",
        body: JSON.stringify({
          voucheeId: student.studentId,
          comment: comment.trim(),
        }),
      });
      onSuccess(res.vouchId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit vouch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
            Vouch for {student.name}
          </h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-gray-700" style={{ fontFamily: "Geist", fontSize: "13px", fontWeight: 500 }}>
            Your message
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share why you vouch for this person…"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors resize-none"
            style={{ fontFamily: "Geist", fontSize: "15px" }}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-500" style={{ fontFamily: "Geist" }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || submitting}
            className={`flex-1 py-3 rounded-2xl text-white transition-all flex items-center justify-center gap-2 ${
              comment.trim() && !submitting
                ? "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            style={{
              fontFamily: "Geist", fontSize: "15px", fontWeight: 500,
              boxShadow: comment.trim() && !submitting
                ? "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)"
                : "none",
            }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Vouch"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main StudentProfile page ─────────────────────────────────────────────────
export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();

  const [student, setStudent]               = useState<StudentData | null>(null);
  const [vouches, setVouches]               = useState<VouchData[]>([]);
  const [reviews, setReviews]               = useState<ReviewData[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [currentUser, setCurrentUser]       = useState<any>(null);
  const [activeTab, setActiveTab]           = useState<"overview" | "posted">("overview");
  const [showVouchModal, setShowVouchModal] = useState(false);

  // ── Load current user from GET /api/auth/me ──
  useEffect(() => {
    request("/auth/me")
      .then((res: any) => setCurrentUser(res.student ?? null))
      .catch(() => {});
  }, []);

  // ── Load student data ──
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      // GET /api/students/:studentId → { success, student: { ...fields, skills[] } }
      request(`/students/${id}`),
      // GET /api/students/:studentId/vouches → { success, count, vouches[] }
      request(`/students/${id}/vouches`),
      // GET /api/students/:studentId/reviews → { success, count, reviews[] }
      request(`/students/${id}/reviews`),
    ])
      .then(([studentRes, vouchRes, reviewRes]) => {
        setStudent(studentRes.student ?? studentRes);
        setVouches(vouchRes.vouches ?? []);
        setReviews(reviewRes.reviews ?? []);
      })
      .catch((err) => setError(err.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Derived ──
  const isOwnProfile = currentUser && student && currentUser.studentId === student.studentId;
  const hasVouched   = currentUser ? vouches.some((v) => v.voucherId === currentUser.studentId) : false;
  // Only verifiedReviewer students can vouch (backend enforces this too)
  const canVouch     = !isOwnProfile && currentUser?.verifiedReviewer && !hasVouched;

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </div>
  );

  // ── Error ──
  if (error || !student) return (
    <div className="min-h-screen">
      <VideoBackground /><TopBar /><Sidebar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error || "Student not found"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      {/* ── Vouch Modal ── */}
      <AnimatePresence>
        {showVouchModal && (
          <VouchModal
            student={student}
            onClose={() => setShowVouchModal(false)}
            onSuccess={(vouchId) => {
              setVouches((prev) => [{
                vouchId,
                comment: "",
                createdAt: new Date().toISOString(),
                voucherName: currentUser?.name ?? "You",
                voucherId: currentUser?.studentId,
                skillName: null,
                skillId: null,
              }, ...prev]);
              setStudent((s) => s ? { ...s, totalVouchCount: s.totalVouchCount + 1 } : s);
            }}
          />
        )}
      </AnimatePresence>

      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* ── Profile card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 mb-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex gap-6">
                {/* Avatar */}
                <div className="w-28 h-28 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {student.profilePicture ? (
                    <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-white" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      {student.name}
                    </h2>
                    {/* verifiedReviewer = completed 3+ jobs */}
                    {student.verifiedReviewer && (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs"
                        style={{ fontFamily: "Geist", fontWeight: 500 }}
                        title="Completed 3+ jobs — can give vouches"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 mb-2">
                    <span style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      Roll: {student.rollNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      Member since{" "}
                      {new Date(student.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Stars value={student.workerRating} size="w-4 h-4" />
                      <span className="text-sm text-gray-600" style={{ fontFamily: "Geist" }}>
                        {Number(student.workerRating).toFixed(1)} worker
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons (top right) */}
              {!isOwnProfile && currentUser && (
                <div className="flex flex-col gap-2 items-end">
                  {canVouch ? (
                    <button
                      onClick={() => setShowVouchModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl flex items-center gap-2 hover:from-[#333] hover:to-[#222] transition-all"
                      style={{
                        fontFamily: "Geist", fontSize: "14px", fontWeight: 500,
                        boxShadow: "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)",
                      }}
                    >
                      <Award className="w-4 h-4" />
                      Vouch
                    </button>
                  ) : hasVouched ? (
                    <span className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2"
                      style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                    >
                      <Check className="w-4 h-4" />
                      Vouched
                    </span>
                  ) : !currentUser.verifiedReviewer ? (
                    <span
                      className="px-5 py-2.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl flex items-center gap-2"
                      style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                      title="Complete 3+ jobs to unlock vouching"
                    >
                      <Award className="w-4 h-4" />
                      Vouch
                    </span>
                  ) : null}

                  <p className="text-xs text-gray-400 text-right max-w-[160px]" style={{ fontFamily: "Geist" }}>
                    Reviews are given from the job page after completion
                  </p>
                </div>
              )}
            </div>

            {/* Bio */}
            {student.bio && (
              <div className="mb-8">
                <h3 className="text-lg mb-3" style={{ fontFamily: "Geist", fontWeight: 600 }}>About</h3>
                <p className="text-gray-700" style={{ fontFamily: "Geist", fontSize: "15px", lineHeight: "1.7" }}>
                  {student.bio}
                </p>
              </div>
            )}

            {/* Stats — all real backend fields */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { value: student.jobsCompletedCount,    label: "Jobs Completed"  },
                { value: student.totalVouchCount,       label: "Total Vouches"   },
                { value: `${student.completionRate}%`,  label: "Completion Rate" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{stat.value}</p>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>{stat.label}</p>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <p className="text-sm" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    {new Date(student.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>Member Since</p>
              </div>
            </div>
          </motion.div>

          {/* ── Tabs card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 mb-6"
          >
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {([
                { key: "overview", label: "Overview",    icon: null },
                { key: "posted",   label: "Posted Jobs", icon: <FileText className="w-4 h-4" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-6 py-3 flex items-center gap-2 transition-all ${
                    activeTab === key ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: activeTab === key ? 500 : 400 }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">

                {/* Ratings — workerRating & giverRating, updated by POST /api/jobs/:jobId/reviews */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <TrendingUp className="w-5 h-5" /> Rating as Worker
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                        {Number(student.workerRating).toFixed(1)}
                      </div>
                      <div>
                        <Stars value={student.workerRating} />
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Geist" }}>
                          Based on {student.workerRatingCount} review{student.workerRatingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all"
                        style={{ width: `${(student.workerRating / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* giverRating = how well they behave as a job poster */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <Briefcase className="w-5 h-5" /> Rating as Job Poster
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                        {Number(student.giverRating).toFixed(1)}
                      </div>
                      <div>
                        <Stars value={student.giverRating} />
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Geist" }}>
                          Based on {student.giverRatingCount} review{student.giverRatingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${(student.giverRating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Skills — bundled in student response from GET /api/students/:id */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl mb-6" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    Skills &amp; Proficiency
                  </h3>
                  {student.skills.length === 0 ? (
                    <p className="text-center text-gray-400 py-6" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      No skills added yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {student.skills.map((skill) => (
                        <div
                          key={skill.studentSkillId}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                        >
                          <div>
                            <span style={{ fontFamily: "Geist", fontSize: "15px", fontWeight: 500 }}>
                              {skill.skillName}
                            </span>
                            {skill.category && (
                              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "Geist" }}>
                                {skill.category}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* relevantComp = vouch count for this specific skill */}
                            {skill.relevantComp > 0 && (
                              <span
                                className="text-xs text-gray-500 flex items-center gap-1"
                                style={{ fontFamily: "Geist" }}
                                title="Vouches for this skill"
                              >
                                <Award className="w-3 h-3" />{skill.relevantComp}
                              </span>
                            )}
                            <span
                              className={`px-3 py-1 rounded-lg text-xs border ${getLevelColor(skill.proficiencyLevel)}`}
                              style={{ fontFamily: "Geist", fontWeight: 500 }}
                            >
                              {getLevelLabel(skill.proficiencyLevel)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviews — from GET /api/students/:id/reviews */}
                {/* Submitted via POST /api/jobs/:jobId/reviews after job completion */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl mb-6 flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                    <Star className="w-5 h-5" /> Reviews ({reviews.length})
                  </h3>
                  {reviews.length === 0 ? (
                    <p className="text-center text-gray-400 py-6" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      No reviews yet. Reviews are submitted after a completed job.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <motion.div
                          key={r.reviewId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span style={{ fontFamily: "Geist", fontWeight: 600, fontSize: "14px" }}>
                                  {r.reviewerName?.[0] ?? "?"}
                                </span>
                              </div>
                              <div>
                                <p style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}>
                                  {r.reviewerName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-gray-500" style={{ fontFamily: "Geist" }}>
                                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                  </p>
                                  {r.jobTitle && (
                                    <>
                                      <span className="text-gray-300">·</span>
                                      <Link
                                        to={`/jobs/${r.jobId}`}
                                        className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
                                        style={{ fontFamily: "Geist" }}
                                      >
                                        {r.jobTitle}
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Stars value={r.rating} size="w-4 h-4" />
                          </div>
                          {r.comment && (
                            <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6" }}>
                              {r.comment}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vouches — from GET /api/students/:id/vouches */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl flex items-center gap-2" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                      <Award className="w-5 h-5" /> Vouches ({vouches.length})
                    </h3>
                    {canVouch && (
                      <button
                        onClick={() => setShowVouchModal(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2 transition-colors"
                        style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                      >
                        <Award className="w-4 h-4" />
                        Vouch
                      </button>
                    )}
                  </div>
                  {vouches.length === 0 ? (
                    <p className="text-center text-gray-400 py-6" style={{ fontFamily: "Geist", fontSize: "14px" }}>
                      No vouches yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {vouches.map((v) => (
                          <motion.div
                            key={v.vouchId}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span style={{ fontFamily: "Geist", fontWeight: 600, fontSize: "14px" }}>
                                    {v.voucherName?.[0] ?? "?"}
                                  </span>
                                </div>
                                <div>
                                  <p style={{ fontFamily: "Geist", fontWeight: 500, fontSize: "15px" }}>
                                    {v.voucherName}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500" style={{ fontFamily: "Geist" }}>
                                      {new Date(v.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </p>
                                    {v.skillName && (
                                      <>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md" style={{ fontFamily: "Geist" }}>
                                          {v.skillName}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* DELETE /api/vouches/:vouchId — only the voucher can retract */}
                              {currentUser && currentUser.studentId === v.voucherId && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await request(`/vouches/${v.vouchId}`, { method: "DELETE" });
                                      setVouches((prev) => prev.filter((vouch) => vouch.vouchId !== v.vouchId));
                                      setStudent((s) => s ? { ...s, totalVouchCount: Math.max(s.totalVouchCount - 1, 0) } : s);
                                    } catch (err: any) {
                                      alert(err.message || "Failed to retract vouch");
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center hover:bg-red-100 rounded-lg text-red-500"
                                  title="Retract vouch"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {v.comment && (
                              <p className="text-gray-700 text-sm" style={{ fontFamily: "Geist", lineHeight: "1.6", paddingLeft: "52px" }}>
                                {v.comment}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Posted Jobs tab ── */}
            {activeTab === "posted" && (
              <PostedJobsTab studentId={student.studentId} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Posted Jobs sub-component ────────────────────────────────────────────────
// Backend has no GET /students/:id/jobs route.
// We use GET /api/jobs (listJobs) which returns jobs with postedBy field,
// then filter client-side. Only OPEN jobs are returned by default.
function PostedJobsTab({ studentId }: { studentId: number }) {
  const [jobs, setJobs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/jobs")
      .then((res: any) => {
        const all = res.jobs ?? [];
        setJobs(all.filter((j: any) => j.postedBy === studentId));
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (jobs.length === 0) return (
    <p className="text-center text-gray-400 py-8" style={{ fontFamily: "Geist", fontSize: "14px" }}>
      No open jobs posted.
    </p>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl mb-4" style={{ fontFamily: "Geist", fontWeight: 600 }}>
        Posted Jobs ({jobs.length})
      </h3>
      {jobs.map((job: any) => (
        <div
          key={job.jobId}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg mb-1" style={{ fontFamily: "Geist", fontWeight: 600 }}>{job.title}</h4>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "Geist" }}>
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : ""}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(job.status)}`}
              style={{ fontFamily: "Geist", fontWeight: 500 }}
            >
              {job.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              {job.budget && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span style={{ fontFamily: "Geist" }}>{job.budget}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span style={{ fontFamily: "Geist" }}>
                    Due {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
            <Link
              to={`/jobs/${job.jobId}`}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
              style={{ fontFamily: "Geist", fontWeight: 500 }}
            >
              View Job →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}