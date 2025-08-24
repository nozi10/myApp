"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipBack, SkipForward, Volume2, Gauge } from "lucide-react"

interface AudioControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  onTogglePlayPause: () => void
  onSeek: (value: number[]) => void
  onSpeedChange: (speed: number) => void
  onVolumeChange: (value: number[]) => void
  onSkipBackward: () => void
  onSkipForward: () => void
  formatTime: (time: number) => string
}

export function AudioControls({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  onTogglePlayPause,
  onSeek,
  onSpeedChange,
  onVolumeChange,
  onSkipBackward,
  onSkipForward,
  formatTime,
}: AudioControlsProps) {
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  return (
    <div className="h-full flex flex-col">
      {/* Playback Controls */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Play className="h-5 w-5 mr-2" />
            Audio Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={onSkipBackward}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="lg" onClick={onTogglePlayPause} className="h-12 w-12">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onSkipForward}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={onSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Control */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Gauge className="h-4 w-4 mr-2" />
            Playback Speed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-1">
            {speedOptions.map((speed) => (
              <Button
                key={speed}
                variant={playbackRate === speed ? "default" : "outline"}
                size="sm"
                onClick={() => onSpeedChange(speed)}
                className="text-xs"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Volume Control */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Volume2 className="h-4 w-4 mr-2" />
            Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider value={[volume * 100]} onValueChange={onVolumeChange} max={100} step={1} className="flex-1" />
            <span className="text-xs text-muted-foreground w-8">{Math.round(volume * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Reading Stats */}
      <Card className="m-4 mt-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Reading Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current Speed</span>
            <Badge variant="secondary">{playbackRate}x</Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className="font-mono">{formatTime(duration - currentTime)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Est. Finish</span>
            <span className="font-mono">
              {new Date(Date.now() + (duration - currentTime) * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
