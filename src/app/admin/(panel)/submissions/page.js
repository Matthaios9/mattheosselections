import { Suspense } from 'react';
import Submissions from '@/components/admin/submissions/Submissions';

export const metadata = { title: 'Submissions' };

export default function SubmissionsPage() {
  return (
    <Suspense>
      <Submissions />
    </Suspense>
  );
}
