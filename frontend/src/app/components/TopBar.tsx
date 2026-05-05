import { Link } from "react-router-dom";
import { PlusCircle, User, Menu } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

export default function TopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/jobs">
            <h1 className="text-2xl" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
              comuni
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/post-job">
            <button
              className="px-6 py-2.5 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl transition-all hover:scale-105 flex items-center gap-2"
              style={{
                fontFamily: 'Geist',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: 'inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)',
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Post a Job
            </button>
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            <User className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
