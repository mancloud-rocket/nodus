import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  TooltipProps
} from 'recharts'

interface DataPoint {
  name: string
  value: number
  value2?: number
  [key: string]: string | number | undefined
}

interface TrendChartProps {
  data: DataPoint[]
  dataKey?: string
  dataKey2?: string
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'coral'
  color2?: 'primary' | 'success' | 'warning' | 'destructive' | 'coral'
  height?: number
  showGrid?: boolean
  showAxis?: boolean
}

const colorMap = {
  primary: { stroke: 'hsl(173, 80%, 40%)', fill: 'hsl(173, 80%, 40%)' },
  success: { stroke: 'hsl(160, 84%, 39%)', fill: 'hsl(160, 84%, 39%)' },
  warning: { stroke: 'hsl(38, 92%, 50%)', fill: 'hsl(38, 92%, 50%)' },
  destructive: { stroke: 'hsl(0, 84%, 60%)', fill: 'hsl(0, 84%, 60%)' },
  coral: { stroke: 'hsl(340, 75%, 55%)', fill: 'hsl(340, 75%, 55%)' },
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function TrendChart({ 
  data, 
  dataKey = 'value',
  dataKey2,
  color = 'primary',
  color2 = 'coral',
  height = 200,
  showGrid = false,
  showAxis = true,
}: TrendChartProps) {
  const colors = colorMap[color]
  const colors2 = colorMap[color2]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fill} stopOpacity={0.2} />
            <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
          </linearGradient>
          {dataKey2 && (
            <linearGradient id={`gradient-${color2}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors2.fill} stopOpacity={0.2} />
              <stop offset="100%" stopColor={colors2.fill} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
          />
        )}
        
        {showAxis && (
          <>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              dx={-10}
              width={35}
            />
          </>
        )}
        
        <Tooltip content={<CustomTooltip />} />
        
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={colors.stroke}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />

        {dataKey2 && (
          <Area
            type="monotone"
            dataKey={dataKey2}
            stroke={colors2.stroke}
            strokeWidth={2}
            fill={`url(#gradient-${color2})`}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
