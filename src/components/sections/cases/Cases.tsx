import { useCases } from '../../../data/cases'
import { CaseSection } from './CaseSection'

export const Cases = () => {
    const cases = useCases()

    return cases.map((caseItem) => (
        <CaseSection key={caseItem.id} caseData={caseItem} />
    ))
}
