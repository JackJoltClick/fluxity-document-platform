interface SchemaProgressProps {
  currentStep: number;
  totalSteps: number;
  fieldName?: string;
}

export function SchemaProgress({ currentStep, totalSteps, fieldName }: SchemaProgressProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="mb-2">
        <div className="bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gray-900 h-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-sm text-gray-600">
        {fieldName ? (
          <>Field {currentStep} of {totalSteps - 2}: <span className="font-medium text-gray-900">{fieldName}</span></>
        ) : currentStep === totalSteps - 1 ? (
          <span className="font-medium text-gray-900">Business Rules Configuration</span>
        ) : (
          <span className="font-medium text-gray-900">Review and Save</span>
        )}
      </div>
    </div>
  );
}