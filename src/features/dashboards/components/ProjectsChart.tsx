import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { name: 'Discovery', G1: 8, G2: 12, G3: 6, G4: 4 },
  { name: 'Desenvolvimento', G1: 12, G2: 8, G3: 10, G4: 6 },
  { name: 'Testes', G1: 6, G2: 15, G3: 8, G4: 9 },
  { name: 'Deploy', G1: 4, G2: 6, G3: 12, G4: 8 },
  { name: 'Produção', G1: 2, G2: 4, G3: 6, G4: 24 },
]

export function ProjectsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="G1" stackId="a" fill="#1976d2" name="G1 - Ideação" />
        <Bar dataKey="G2" stackId="a" fill="#42a5f5" name="G2 - Aprovação" />
        <Bar dataKey="G3" stackId="a" fill="#90caf9" name="G3 - Desenvolvimento" />
        <Bar dataKey="G4" stackId="a" fill="#bbdefb" name="G4 - Produção" />
      </BarChart>
    </ResponsiveContainer>
  )
} 