import { toiletService } from '../services/toiletService';

const UrgencySelector = ({ selectedUrgency, onUrgencyChange, className }) => {
  const urgencyLevels = ['emergency', 'moderate', 'relaxed'];

  return (
    <div className={`${className} bg-white rounded-lg p-4 shadow-sm border border-gray-200`}>
      <div className="flex flex-col space-y-3">
        <h6 className="text-sm font-semibold text-gray-700 mb-2">급한 정도</h6>
        <div className="space-y-2">
          {urgencyLevels.map((level) => {
            const config = toiletService.getUrgencyConfig(level);
            const isSelected = selectedUrgency === level;
            
            return (
              <label 
                key={level} 
                className={`
                  flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 
                  ${isSelected 
                    ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={level}
                  checked={isSelected}
                  onChange={() => onUrgencyChange(level)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className={`text-lg ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {config.label}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium
                      ${config.color === 'danger' ? 'bg-red-100 text-red-600' : 
                        config.color === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-green-100 text-green-600'}
                    `}>
                      {config.radius}m
                    </div>
                  </div>
                  <div className={`text-sm mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {config.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UrgencySelector;