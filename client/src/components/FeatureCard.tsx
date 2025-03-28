import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const colorMap = {
    primary: "bg-blue-600",
    secondary: "bg-green-600",
    accent: "bg-orange-600",
  };

  const bgColor = colorMap[color];

  return (
    <div className="flex">
      <div className="flex-shrink-0">
        <div className={`h-10 w-10 rounded-md ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
