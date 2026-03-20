import { UseCaseDemo } from '@/components/use-case-demo';
import { USE_CASES_BY_SLUG } from '@/lib/use-cases';

export default function AirdropPage() {
  return <UseCaseDemo config={USE_CASES_BY_SLUG.airdrop} />;
}
