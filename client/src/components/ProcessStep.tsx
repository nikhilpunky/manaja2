interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="h-12 w-12 flex items-center justify-center bg-blue-400 text-white rounded-full text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default ProcessStep;
