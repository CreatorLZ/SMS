import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export interface TestimonialAuthor {
  name: string;
  handle: string;
  avatar: string;
}

interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
}

export function TestimonialCard({ author, text }: TestimonialCardProps) {
  return (
    <Card
      className={cn(
        "w-[300px] transition-all",
        "hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      <CardContent className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">{text}</p>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{author.name}</span>
            <span className="text-xs text-muted-foreground">
              {author.handle}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
