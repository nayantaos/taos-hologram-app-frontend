import { useParams, useSearchParams } from "react-router-dom";
import SlidePlayer from "@/components/SlidePlayer";

const Index = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version");

  if (!token) {
    return (
      <div className="text-white h-screen w-full flex items-center justify-center">
        <p>Invalid or missing token.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent overflow-hidden">
      <SlidePlayer slug={token} version={version} />
    </div>
  );
};

export default Index;
