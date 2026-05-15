"use client"

import { ChevronDown, Headphones, Server } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export type PlayerSourceKind = "iframe" | "direct" | "placeholder"

export type PlayerSource = {
  id: string
  server: string
  audio: string
  kind: PlayerSourceKind
  url?: string
}

export type SourceSelectorProps = {
  sources: PlayerSource[]
  selectedServer: string
  selectedAudio: string
  onChangeServer: (server: string) => void
  onChangeAudio: (audio: string) => void
}

export function SourceSelector({
  sources,
  selectedServer,
  selectedAudio,
  onChangeServer,
  onChangeAudio,
}: SourceSelectorProps) {
  const servers = Array.from(new Set(sources.map((s) => s.server)))
  const audios = Array.from(
    new Set(sources.filter((s) => s.server === selectedServer).map((s) => s.audio))
  )

  return (
    <div className="flex flex-wrap gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-background-secondary border-border text-foreground hover:bg-background-tertiary hover:border-primary/25"
          >
            <Server className="w-4 h-4 mr-2 text-primary" />
            {selectedServer}
            <ChevronDown className="w-4 h-4 ml-2 text-foreground-subtle" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
          {servers.map((server) => (
            <DropdownMenuItem
              key={server}
              onClick={() => onChangeServer(server)}
              className={`text-foreground-muted hover:text-foreground hover:bg-background-tertiary focus:bg-background-tertiary focus:text-foreground cursor-pointer ${
                selectedServer === server ? "bg-primary/10 text-primary" : ""
              }`}
            >
              {server}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-background-secondary border-border text-foreground hover:bg-background-tertiary hover:border-primary/25"
          >
            <Headphones className="w-4 h-4 mr-2 text-primary" />
            {selectedAudio}
            <ChevronDown className="w-4 h-4 ml-2 text-foreground-subtle" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
          {audios.map((audio) => (
            <DropdownMenuItem
              key={audio}
              onClick={() => onChangeAudio(audio)}
              className={`text-foreground-muted hover:text-foreground hover:bg-background-tertiary focus:bg-background-tertiary focus:text-foreground cursor-pointer ${
                selectedAudio === audio ? "bg-primary/10 text-primary" : ""
              }`}
            >
              {audio}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
