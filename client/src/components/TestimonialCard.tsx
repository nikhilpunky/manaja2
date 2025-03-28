import { Star, StarHalf } from "lucide-react";

interface TestimonialCardProps {
  rating: number;
  text: string;
  name: string;
  role: string;
  initials: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  rating,
  text,
  name,
  role,
  initials,
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-amber-400 fill-amber-400" size={20} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-amber-400 fill-amber-400" size={20} />);
    }

    return stars;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center text-amber-400 mb-4">
        {renderStars()}
      </div>
      <p className="text-gray-600 mb-4">{text}</p>
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-900 font-medium">
          {initials}
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
