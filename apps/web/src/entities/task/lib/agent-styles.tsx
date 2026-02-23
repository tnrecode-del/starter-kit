import {
  Network,
  ShieldCheck,
  Layout,
  Server,
  Database,
  Sparkles,
  Wrench,
  Bot,
} from "lucide-react";

export function getAgentStyle(agentName: string) {
  const name = agentName.toLowerCase();

  if (name.includes("architect"))
    return {
      icon: <Network className="h-3 w-3" />,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
  if (name.includes("supervisor") || name.includes("manager"))
    return {
      icon: <ShieldCheck className="h-3 w-3" />,
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    };
  if (name.includes("frontend-ui"))
    return {
      icon: <Layout className="h-3 w-3" />,
      color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    };
  if (name.includes("frontend-bizlogic"))
    return {
      icon: <Wrench className="h-3 w-3" />,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
  if (name.includes("backend-api"))
    return {
      icon: <Server className="h-3 w-3" />,
      color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
  if (name.includes("database"))
    return {
      icon: <Database className="h-3 w-3" />,
      color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
  if (name.includes("qa") || name.includes("testing"))
    return {
      icon: <Sparkles className="h-3 w-3" />,
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };

  return {
    icon: <Bot className="h-3 w-3" />,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
}
