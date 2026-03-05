import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number // 0-100
  size?: number // diameter in pixels, default 48
  className?: string
}

export const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ value, size = 48, className, ...props }, ref) => {
  const radius = (size - 8) / 2 // Account for stroke width
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const percentage = Math.round(value)

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("transform -rotate-90", className)}
      {...props}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-secondary opacity-20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-green-500 transition-all duration-300"
      />
      {/* Percentage text */}
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(90)`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-xs font-semibold"
        >
          {percentage}%
        </text>
      </g>
    </svg>
  )
})

CircularProgress.displayName = "CircularProgress"
