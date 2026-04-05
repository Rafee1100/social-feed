import type { LucideIcon } from "lucide-react";
import {
  BookmarkMinus,
  CirclePlay,
  Gamepad2,
  Save,
  Settings,
  SquareKanban,
  UserPlus,
  Users,
} from "lucide-react";

export type ExploreEvent = {
  title: string;
  Icon: LucideIcon;
  isNew: boolean;
};

export const exploreEvents: ExploreEvent[] = [
  { title: "Learning", Icon: CirclePlay, isNew: true },
  { title: "Insights", Icon: SquareKanban, isNew: false },
  { title: "Find friends", Icon: UserPlus, isNew: false },
  { title: "Bookmarks", Icon: BookmarkMinus, isNew: false },
  { title: "Group", Icon: Users, isNew: false },
  { title: "Gaming", Icon: Gamepad2, isNew: true },
  { title: "Settings", Icon: Settings, isNew: false },
  { title: "Save post", Icon: Save, isNew: false },
];

