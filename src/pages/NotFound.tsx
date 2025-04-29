
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-50 p-4 animate-bounce">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-gray-800">
              Oops! Page not found
            </p>
            <p className="text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* <Button
            variant="default"
            size="lg"
            className="bg-gradient-to-r from-red-500 to-purple-600 hover:opacity-90 transition-opacity"
            onClick={() => window.location.href = '/'}
          >
            Return Home
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
