import { Badge } from "@/components/ui/badge";
import { environmentManager } from "@/lib/environment";
import { TestTube, Shield } from "lucide-react";

export const EnvironmentBadge = () => {
  const config = environmentManager.getConfig();
  const isDemo = environmentManager.isDemo();

  if (!config.ui.showEnvironmentBadge) {
    return null;
  }

  return (
    <Badge 
      variant={isDemo ? "secondary" : "default"}
      className={`flex items-center gap-1 ${
        isDemo 
          ? "bg-warning/10 text-warning border-warning/20" 
          : "bg-success/10 text-success border-success/20"
      }`}
    >
      {isDemo ? (
        <TestTube className="h-3 w-3" />
      ) : (
        <Shield className="h-3 w-3" />
      )}
      {config.name}
    </Badge>
  );
};

export default EnvironmentBadge;