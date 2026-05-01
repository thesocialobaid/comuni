import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Search, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  AlertCircle, 
  ChevronDown,
  Loader2
} from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { jobsAPI } from "@/api/jobs";

const categories = ["All", "Development", "Design", "Data", "Content", "AI/ML"];

export default function JobFeed() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        setError(null);
        const data = await jobsAPI.getAll();
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (job as any).category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <VideoBackground />
      <TopBar />
      <Sidebar />

      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-4xl mb-3" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
              Browse All Jobs
            </h2>
            <p className="text-gray-600" style={{ fontFamily: 'Geist', fontSize: '16px' }}>
              {loading ? "Loading opportunities..." : `${filteredJobs.length} open opportunities from FAST students`}
            </p>
          </motion.div>

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
              placeholder="Search jobs by title, skills, or keywords..."
              className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl outline-none focus:border-gray-400 transition-colors shadow-sm"
              style={{ fontFamily: 'Geist', fontSize: '15px' }}
            />
          </motion.div>

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
                      ? 'bg-gray-900 text-white'
                      : 'bg-white/80 backdrop-blur-xl text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                  style={{ fontFamily: 'Geist', fontSize: '14px', fontWeight: 500 }}
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
                style={{ fontFamily: 'Geist', fontSize: '14px', fontWeight: 500 }}
              >
                <option value="newest">Newest First</option>
                <option value="budget-high">Highest Budget</option>
                <option value="budget-low">Lowest Budget</option>
                <option value="deadline">Deadline Soon</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span style={{ fontFamily: 'Geist', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredJobs.length === 0 && (
            <div className="text-center py-20 text-gray-500" style={{ fontFamily: 'Geist' }}>
              No jobs found matching your search.
            </div>
          )}

          {/* Job cards */}
          {!loading && !error && (
            <div className="grid gap-4">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * index }}
                >
                  <Link to={`/jobs/${job.id}`}>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
                              {job.title}
                            </h3>
                            {(job as any).urgent && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs" style={{ fontFamily: 'Geist', fontWeight: 500 }}>
                                <AlertCircle className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm line-clamp-2" style={{ fontFamily: 'Geist' }}>
                            {job.description}
                          </p>
                        </div>
                      </div>

                      {(job as any).skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(job as any).skills.map((skill: string) => (
                            <span
                              key={skill}
                              className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs"
                              style={{ fontFamily: 'Geist', fontWeight: 500 }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-600">
                          {(job as any).budget && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4" />
                              <span style={{ fontFamily: 'Geist', fontWeight: 500 }}>{(job as any).budget}</span>
                            </div>
                          )}
                          {(job as any).applicants !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span style={{ fontFamily: 'Geist' }}>{(job as any).applicants} applied</span>
                            </div>
                          )}
                          {(job as any).deadline && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span style={{ fontFamily: 'Geist' }}>Due {(job as any).deadline}</span>
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontFamily: 'Geist' }}>{job.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}