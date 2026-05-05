import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search, DollarSign, Calendar, AlertCircle,
  ChevronDown, Loader2, Star, Award,
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { request } from "../../api/client";

// Sort options mapped to backend's sortBy values
// Backend supports: newest | deadline | budget
const SORT_OPTIONS = [
  { label: "Newest First",    value: "newest"   },
  { label: "Highest Budget",  value: "budget"   },
  { label: "Deadline Soon",   value: "deadline" },
];

export default function JobFeed() {
  const [activeTab, setActiveTab] = useState<"jobs" | "people">("jobs");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Jobs state ────────────────────────────────────────────────────────────
  const [jobs, setJobs]           = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [sortBy, setSortBy]       = useState("newest");

  // ── People state ──────────────────────────────────────────────────────────
  const [students, setStudents]           = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded]   = useState(false);

  // Debounce ref so we don't hit backend on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch jobs from backend with search + sort query params ───────────────
  const fetchJobs = useCallback((search: string, sort: string) => {
    setJobsLoading(true);
    setJobsError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (sort !== "newest") params.set("sortBy", sort);

    const query = params.toString() ? `?${params.toString()}` : "";

    request(`/jobs${query}`)
      .then((res: any) => setJobs(res.jobs ?? []))
      .catch((err: any) => setJobsError(err.message || "Failed to load jobs"))
      .finally(() => setJobsLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    fetchJobs("", "newest");
  }, []);

  // Re-fetch when sort changes (immediate)
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchJobs(searchQuery, newSort);
  };

  // Re-fetch when search changes (debounced 400ms)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (activeTab === "jobs") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchJobs(value, sortBy);
      }, 400);
    }
  };

  // ── Fetch students (backend supports ?search=) ────────────────────────────
  const fetchStudents = useCallback((search: string) => {
    setStudentsLoading(true);
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    request(`/students${query}`)
      .then((res: any) => setStudents(res.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  // Load students when People tab first opened
  useEffect(() => {
    if (activeTab !== "people" || studentsLoaded) return;
    setStudentsLoaded(true);
    fetchStudents("");
  }, [activeTab]);

  // Debounced search for people tab
  const handlePeopleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStudents(value);
    }, 400);
  };

  // ── Tab switch ────────────────────────────────────────────────────────────
  const handleTabSwitch = (tab: "jobs" | "people") => {
    setActiveTab(tab);
    setSearchQuery("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-4xl mb-3" style={{ fontFamily: "Geist", fontWeight: 600 }}>
              {activeTab === "jobs" ? "Browse All Jobs" : "Find People"}
            </h2>
            <p className="text-gray-600 mb-5" style={{ fontFamily: "Geist", fontSize: "16px" }}>
              {activeTab === "jobs"
                ? jobsLoading
                  ? "Loading opportunities…"
                  : `${jobs.length} open opportunit${jobs.length !== 1 ? "ies" : "y"} from FAST students`
                : studentsLoading
                  ? "Loading students…"
                  : `${students.length} student${students.length !== 1 ? "s" : ""} found`
              }
            </p>

            {/* Tab toggle */}
            <div className="flex gap-2">
              {(["jobs", "people"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabSwitch(tab)}
                  className={`px-6 py-2.5 rounded-xl transition-all ${
                    activeTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                >
                  {tab === "jobs" ? "Jobs" : "People"}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Search bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 relative"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                handleSearchChange(e.target.value);
                if (activeTab === "people") handlePeopleSearch(e.target.value);
              }}
              placeholder={
                activeTab === "jobs"
                  ? "Search jobs by title or description…"
                  : "Search students by name or roll number…"
              }
              className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl outline-none focus:border-gray-400 transition-colors shadow-sm"
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
          </motion.div>

          {/* ── Sort dropdown — only on Jobs tab ── */}
          {activeTab === "jobs" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center justify-end mb-6"
            >
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl outline-none cursor-pointer"
                  style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* ── Jobs tab ── */}
          {activeTab === "jobs" && (
            <>
              {jobsLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {jobsError && !jobsLoading && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span style={{ fontFamily: "Geist", fontSize: "14px" }}>{jobsError}</span>
                </div>
              )}

              {!jobsLoading && !jobsError && jobs.length === 0 && (
                <div className="text-center py-20 text-gray-500" style={{ fontFamily: "Geist" }}>
                  No jobs found matching your search.
                </div>
              )}

              {!jobsLoading && !jobsError && jobs.length > 0 && (
                <div className="grid gap-4">
                  <AnimatePresence>
                    {jobs.map((job, index) => (
                      <motion.div
                        key={job.jobId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, delay: 0.03 * index }}
                      >
                        <Link to={`/jobs/${job.jobId}`}>
                          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="text-xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                                    {job.title}
                                  </h3>
                                  {job.urgent && (
                                    <span
                                      className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs"
                                      style={{ fontFamily: "Geist", fontWeight: 500 }}
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                      Urgent
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm mb-2" style={{ fontFamily: "Geist" }}>
                                  Posted by {job.posterName ?? "Unknown"}
                                  {job.posterRating > 0 && (
                                    <span className="ml-2 inline-flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      {Number(job.posterRating).toFixed(1)}
                                    </span>
                                  )}
                                </p>
                                <p className="text-gray-700 text-sm line-clamp-2" style={{ fontFamily: "Geist" }}>
                                  {job.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                              {job.budget && (
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4" />
                                  <span style={{ fontFamily: "Geist", fontWeight: 500 }}>{job.budget}</span>
                                </div>
                              )}
                              {job.deadline && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  <span style={{ fontFamily: "Geist" }}>
                                    Due {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* ── People tab ── */}
          {activeTab === "people" && (
            <>
              {studentsLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {!studentsLoading && students.length === 0 && (
                <p className="text-center text-gray-400 py-20" style={{ fontFamily: "Geist" }}>
                  No students found.
                </p>
              )}

              {!studentsLoading && students.length > 0 && (
                <div className="grid gap-4">
                  {students.map((student) => (
                    <Link to={`/students/${student.studentId}`} key={student.studentId}>
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-14 h-14 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {student.profilePicture ? (
                            <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-lg" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                              {student.name?.[0] ?? "?"}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                              {student.name}
                            </h3>
                            {student.verifiedReviewer && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md" style={{ fontFamily: "Geist", fontWeight: 500 }}>
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: "Geist" }}>
                            {student.rollNumber}
                          </p>
                          {student.bio && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-1" style={{ fontFamily: "Geist" }}>
                              {student.bio}
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                          {student.workerRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span style={{ fontFamily: "Geist", fontWeight: 500 }}>
                                {Number(student.workerRating).toFixed(1)}
                              </span>
                            </div>
                          )}
                          {student.totalVouchCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span style={{ fontFamily: "Geist" }}>{student.totalVouchCount}</span>
                            </div>
                          )}
                          {student.jobsCompletedCount > 0 && (
                            <span className="text-xs text-gray-400" style={{ fontFamily: "Geist" }}>
                              {student.jobsCompletedCount} jobs
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}