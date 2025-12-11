import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_protected/courses/$courseId/attendance',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/courses/$courseId/attendance"!</div>
}
