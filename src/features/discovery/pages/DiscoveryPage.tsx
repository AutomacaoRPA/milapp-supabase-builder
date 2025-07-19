import { useState } from 'react'
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { ChatInterface } from '../components/ChatInterface'
import { FileUploadZone } from '../components/FileUploadZone'
import { RequirementsGenerator } from '../components/RequirementsGenerator'
import { AdvancedAnalysis } from '../components/AdvancedAnalysis'
import { ProcessAnalysis } from '../../../types/ai'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discovery-tabpanel-${index}`}
      aria-labelledby={`discovery-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function DiscoveryPage() {
  const [tabValue, setTabValue] = useState(0)
  const [currentAnalysis, setCurrentAnalysis] = useState<ProcessAnalysis | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAnalysisComplete = (analysis: ProcessAnalysis) => {
    setCurrentAnalysis(analysis)
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontFamily: '"Darker Grotesque", sans-serif',
              fontWeight: 700,
              color: 'primary.main',
              mb: 1
            }}
          >
            Discovery
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'secondary.main',
              fontFamily: '"Antique Olive", sans-serif',
              fontWeight: 500,
              mb: 2
            }}
          >
            bem descobrir bem
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '800px',
              fontSize: '16px',
              lineHeight: 1.7
            }}
          >
            Descubra oportunidades de automação com inteligência artificial. 
            Analise processos, gere recomendações e crie documentação completa 
            seguindo o conceito "bem descobrir bem" da MedSênior.
          </Typography>
        </Box>
      </motion.div>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Discovery tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontFamily: '"Darker Grotesque", sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              minHeight: 64
            }
          }}
        >
          <Tab 
            label="Análise Avançada" 
            id="discovery-tab-0"
            aria-controls="discovery-tabpanel-0"
          />
          <Tab 
            label="Chat IA" 
            id="discovery-tab-1"
            aria-controls="discovery-tabpanel-1"
          />
          <Tab 
            label="Upload de Arquivos" 
            id="discovery-tab-2"
            aria-controls="discovery-tabpanel-2"
          />
          <Tab 
            label="Gerador de Requisitos" 
            id="discovery-tab-3"
            aria-controls="discovery-tabpanel-3"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <AdvancedAnalysis onAnalysisComplete={handleAnalysisComplete} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ChatInterface />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <FileUploadZone />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <RequirementsGenerator />
        </TabPanel>
      </Paper>
    </Box>
  )
} 