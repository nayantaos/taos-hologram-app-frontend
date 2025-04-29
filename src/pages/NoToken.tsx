
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle,Link2Off  } from "lucide-react";

const NotFound = () => {
  const location = useLocation();



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
      <div className="w-full  mx-auto p-8">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-50 p-4 animate-bounce">
              <Link2Off className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-6xl leading-[1] md:leading-[1.5] font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          Missing Token
          </h1>
          
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-gray-800">
            Please provide your token in the URL to proceed.
            </p>
            {/* <p className="text-gray-600">
            <code>{import.meta.env.VITE_API_BASE_URL}/{'{your-token-here}'}</code>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
