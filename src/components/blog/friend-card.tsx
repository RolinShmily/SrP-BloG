"use client";

import { useState } from "react";
import type { FriendLink } from "@/lib/friends";
import { Card } from "@/components/ui/card";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import { ArrowUpRight, Globe } from "lucide-react";

interface FriendCardProps {
  friend: FriendLink;
}

export function FriendCard({ friend }: FriendCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full select-none"
    >
      <Card className="card-spotlight card-interactive relative h-full p-4 border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none">
        <div className="relative z-10 flex items-start gap-3.5">
          {/* Avatar */}
          <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 border border-border/80 bg-muted/50 flex items-center justify-center">
            {!imageError && friend.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.avatar}
                alt={friend.name}
                className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <Globe className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-sm font-medium font-mono text-foreground group-hover:text-[#f75c7e] transition-colors duration-200 truncate">
                {friend.name}
              </h3>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-[#f75c7e] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
            </div>
            {friend.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {friend.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                <T
                  zh={dictionaries.zh.friends.noDescription}
                  en={dictionaries.en.friends.noDescription}
                />
              </p>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
}
