import { Link } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

import { useAuth } from "../lib/auth";
import { ROLE_DESCRIPTIONS } from "../lib/roles";

const QUICK_ACTIONS = [
  {
    title: "Generate checklist",
    description: "Build the next iteration of your ASVS work plan.",
    action: { label: "Open checklist", to: "/checklist" }
  },
  {
    title: "Link Rally epics",
    description: "Connect tasks to Rally work items via the adapter layer.",
    action: { label: "View integrations", to: "/checklist#rally" }
  }
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout
      title={`Welcome back${user ? `, ${user.name}` : ""}`}
      subtitle={user ? ROLE_DESCRIPTIONS[user.role] : undefined}
      actions={
        <Button asChild variant="secondary">
          <Link to="/checklist">New checklist</Link>
        </Button>
      }
    >
      <section className="grid gap-6 md:grid-cols-2">
        {QUICK_ACTIONS.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <Badge variant="outline">ASVS</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button asChild>
                <Link to={item.action.to}>{item.action.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppLayout>
  );
}

