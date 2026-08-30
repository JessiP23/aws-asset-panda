import { PhotoGradeResult } from "@/lib/types"

const GRADE_COLORS: Record<PhotoGradeResult['conditionGrade'], string> = {
  Good: 'bg-green-100 text-green-800',
  Fair: 'bg-yellow-100 text-yellow-800',
  Damaged: 'bg-red-100 text-red-800',
};

export function ConditionBadge({ result }: {result: PhotoGradeResult}) {
    const needsReview = result.confidence === 'low' || result.conditionGrade === 'Damaged';

    return (
        <div className="space-y-1">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${GRADE_COLORS[result.conditionGrade]}`}>
                {result.conditionGrade}
            </span>
            {needsReview && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Needs review
                </span>
            )}
            <p className="text-xs text-gray-500">{result.notes}</p>
        </div>
    );
}