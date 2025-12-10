import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/courses/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/courses/"!</div>
}
