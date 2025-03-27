import { Dumbbell, Brain, Sparkles } from "lucide-react"

export default function ActiveSubscriptions() {
  // Mock data for active subscriptions
  const subscriptions = [
    {
      id: "1",
      name: "Fitness Premium",
      type: "fitness",
      status: "active",
      expiresAt: "March 15, 2024",
    },
    {
      id: "2",
      name: "Psychological Basic",
      type: "psychological",
      status: "active",
      expiresAt: "April 10, 2024",
    },
    {
      id: "3",
      name: "Manifestation Pro",
      type: "manifestation",
      status: "active",
      expiresAt: "February 28, 2024",
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "fitness":
        return <Dumbbell className="h-5 w-5 text-gray-700" />
      case "psychological":
        return <Brain className="h-5 w-5 text-purple-700" />
      case "manifestation":
        return <Sparkles className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case "fitness":
        return "bg-blue-100"
      case "psychological":
        return "bg-purple-100"
      case "manifestation":
        return "bg-amber-100"
      default:
        return "bg-gray-100"
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Active Subscriptions</h2>
      <p className="text-muted-foreground mb-6">Your current active plans</p>

      <div className="space-y-6">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="flex justify-between items-center border-b pb-6 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className={`${getIconBg(subscription.type)} p-3 rounded-full`}>{getIcon(subscription.type)}</div>
              <div>
                <p className="font-bold text-lg">{subscription.name}</p>
                <p className="text-muted-foreground">Expires: {subscription.expiresAt}</p>
              </div>
            </div>
            <div className="px-3 py-1 border rounded-full text-sm font-medium">Active</div>
          </div>
        ))}
      </div>
    </div>
  )
}

