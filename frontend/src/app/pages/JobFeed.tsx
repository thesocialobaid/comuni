import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  DollarSign,
  Calendar,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { jobsAPI } from "../../api/jobs";
import { studentsAPI } from "../../api/students";

const categories = ["All", "Development", "Design", "Data", "Content", "AI/ML"];

export default function JobFeed() {
  const [activeTab, setActiveTab] = useState<"jobs" | "people">("jobs");

  // Shared search — resets when tab switches
  const [searchQuery, setSearchQuery] = useState("");

  // Jobs state
  const [jobs, setJobs]                   = useState<any[]>([]);
  const [jobsLoading, setJobsLoading]     = useState(true);
  const [jobsError, setJobsError]         = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy]               = useState("newest");

  // People state
  const [students, setStudents]           = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Fetch jobs once
  useEffect(() => {
    jobsAPI.getAll()
      .then((data) => setJobs(data))
      .catch((err) => setJobsError(err instanceof Error ? err.message : "Failed to load jobs"))
      .finally(() => setJobsLoading(false));
  }, []);

  // Fetch students when People tab is first opened
  useEffect(() => {
    if (activeTab !== "people" || students.length > 0) return;
    setStudentsLoading(true);
    studentsAPI.getAll()
      .then((data) => setStudents(data))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [activeTab]);

  // Reset search when switching tabs
  const handleTabSwitch = (tab: "jobs" | "people") => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // Filtered + sorted jobs
  const filteredJobs = jobs
    .filter((job) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "All" ||
        job.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "budget-high") return (parseFloat(b.budget) || 0) - (parseFloat(a.budget) || 0);
      if (sortBy === "budget-low")  return (parseFloat(a.budget) || 0) - (parseFloat(b.budget) || 0);
      if (sortBy === "deadline")    return new Date(a.deadline ?? "").getTime() - new Date(b.deadline ?? "").getTime();
      // newest first (default)
      return new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime();
    });

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      q === "" ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q)
    );
  });

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
                  : `${filteredJobs.length} open opportunity${filteredJobs.length !== 1 ? "ies" : "y"} from FAST students`
                : studentsLoading
                  ? "Loading students…"
                  : `${filteredStudents.length} student${filteredStudents.length !== 1 ? "s" : ""} found`
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

          {/* ── Single search bar — placeholder changes per tab ── */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "jobs"
                  ? "Search jobs by title, skills, or keywords…"
                  : "Search students by name, email, or roll number…"
              }
              className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl outline-none focus:border-gray-400 transition-colors shadow-sm"
              style={{ fontFamily: "Geist", fontSize: "15px" }}
            />
          </motion.div>

          {/* ── Category filters + sort — only on Jobs tab ── */}
          {activeTab === "jobs" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      selectedCategory === category
                        ? "bg-gray-900 text-white"
                        : "bg-white/80 backdrop-blur-xl text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                    style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl outline-none cursor-pointer"
                  style={{ fontFamily: "Geist", fontSize: "14px", fontWeight: 500 }}
                >
                  <option value="newest">Newest First</option>
                  <option value="budget-high">Highest Budget</option>
                  <option value="budget-low">Lowest Budget</option>
                  <option value="deadline">Deadline Soon</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* ── Jobs tab content ── */}
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

              {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
                <div className="text-center py-20 text-gray-500" style={{ fontFamily: "Geist" }}>
                  No jobs found matching your search.
                </div>
              )}

              {!jobsLoading && !jobsError && (
                <div className="grid gap-4">
                  {filteredJobs.map((job, index) => (
                    <motion.div
                      key={job.jobId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.04 * index }}
                    >
                      <Link to={`/jobs/${job.jobId}`}>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-xl" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                                  {job.title}
                                </h3>
                                <p className="text-gray-500 text-sm" style={{ fontFamily: "Geist" }}>
                                  Posted by {job.posterName ?? job.name ?? "Unknown"}
                                </p>
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
                              <p className="text-gray-700 text-sm line-clamp-2" style={{ fontFamily: "Geist" }}>
                                {job.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {job.budget && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                <span style={{ fontFamily: "Geist", fontWeight: 500 }}>{job.budget}</span>
                              </div>
                            )}
                            {job.deadline && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span style={{ fontFamily: "Geist" }}>Due {job.deadline}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── People tab content ── */}
          {activeTab === "people" && (
            <>
              {studentsLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {!studentsLoading && filteredStudents.length === 0 && (
                <p className="text-center text-gray-400 py-20" style={{ fontFamily: "Geist" }}>
                  No students found.
                </p>
              )}

              {!studentsLoading && filteredStudents.length > 0 && (
                <div className="grid gap-4">
                  {filteredStudents.map((student) => (
                    <Link to={`/students/${student.studentId}`} key={student.studentId}>
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer flex items-center gap-5">
                        <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                            {student.name?.[0] ?? "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg mb-0.5" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                            {student.name}
                          </h3>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: "Geist" }}>
                            {student.rollNumber}
                          </p>
                          {student.bio && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-1" style={{ fontFamily: "Geist" }}>
                              {student.bio}
                            </p>
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