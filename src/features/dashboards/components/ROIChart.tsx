import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { quarter: 'Q1 2024', ROI: 280, target: 300 },
  { quarter: 'Q2 2024', ROI: 320, target: 300 },
  { quarter: 'Q3 2024', ROI: 340, target: 300 },
  { quarter: 'Q4 2024', ROI: 380, target: 300 },
]

export function ROIChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="quarter" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ROI" 
          stroke="#1976d2" 
          strokeWidth={3}
          name="ROI Real (%)"
        />
        <Line 
          type="monotone" 
          dataKey="target" 
          stroke="#dc004e" 
          strokeDasharray="5 5"
          name="Meta (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
} 