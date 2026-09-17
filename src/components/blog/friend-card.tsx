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
      className="group block h-full"
    >
      <Card className="h-full p-4 hover:border-foreground/30 hover:bg-muted/30 transition-all duration-200 shadow-none">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/50 flex items-center justify-center">
            {!imageError && friend.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.avatar}
                alt={friend.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
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
              <h3 className="text-sm font-medium text-foreground group-hover:underline decoration-1 underline-offset-4 truncate">
                {friend.name}
              </h3>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
