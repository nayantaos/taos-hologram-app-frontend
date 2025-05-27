import { useParams } from "react-router-dom";
import SlidePlayer from "@/components/SlidePlayer";


const Index = () => {
  const { token } = useParams();
  console.log('ToKEN ======>',token);
  
  if (!token) {
    return (
      <div className="text-white h-screen w-full flex items-center justify-center">
        <p>Invalid or missing token.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent overflow-hidden">
      <SlidePlayer slug={token} />
    </div>
  );
};

export default Index;
