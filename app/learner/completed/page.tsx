import { redirect } from 'next/navigation'
export default function CompletedPage() { redirect('/learner/assignments?filter=submitted') }
