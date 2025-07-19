import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer,
  Image 
} from '@react-pdf/renderer'

export interface MedSeniorReportData {
  title: string
  subtitle?: string
  company: string
  date: string
  author: string
  content: ReportSection[]
  footer?: string
  logo?: string
}

export interface ReportSection {
  title: string
  type: 'text' | 'table' | 'chart' | 'metrics'
  data: any
}

export class MedSeniorPDFReportService {
  private static instance: MedSeniorPDFReportService

  static getInstance(): MedSeniorPDFReportService {
    if (!this.instance) {
      this.instance = new MedSeniorPDFReportService()
    }
    return this.instance
  }

  // Gerar relatório de projeto
  async generateProjectReport(projectData: any): Promise<Blob> {
    const reportData: MedSeniorReportData = {
      title: `Relatório de Projeto - ${projectData.name}`,
      subtitle: 'Centro de Excelência em Automação',
      company: 'MedSênior',
      date: new Date().toLocaleDateString('pt-BR'),
      author: projectData.owner || 'Sistema MILAPP',
      content: [
        {
          title: 'Informações Gerais',
          type: 'table',
          data: {
            headers: ['Campo', 'Valor'],
            rows: [
              ['Nome do Projeto', projectData.name],
              ['Descrição', projectData.description],
              ['Status', projectData.status],
              ['Prioridade', projectData.priority],
              ['ROI Estimado', `${projectData.estimated_roi}%`],
              ['Data Início', projectData.start_date],
              ['Data Meta', projectData.target_date]
            ]
          }
        },
        {
          title: 'Métricas de Performance',
          type: 'metrics',
          data: {
            complexity: projectData.complexity,
            estimated_roi: projectData.estimated_roi,
            progress: projectData.progress || 0
          }
        },
        {
          title: 'Quality Gates',
          type: 'table',
          data: {
            headers: ['Gate', 'Status', 'Data', 'Aprovador'],
            rows: [
              ['G1 - Ideação', projectData.g1_status || 'Pendente', projectData.g1_date || '-', projectData.g1_approver || '-'],
              ['G2 - Planejamento', projectData.g2_status || 'Pendente', projectData.g2_date || '-', projectData.g2_approver || '-'],
              ['G3 - Desenvolvimento', projectData.g3_status || 'Pendente', projectData.g3_date || '-', projectData.g3_approver || '-'],
              ['G4 - Produção', projectData.g4_status || 'Pendente', projectData.g4_date || '-', projectData.g4_approver || '-']
            ]
          }
        }
      ],
      footer: 'MILAPP MedSênior - Centro de Excelência em Automação - bem envelhecer bem'
    }

    return this.generatePDF(reportData)
  }

  // Gerar relatório de analytics
  async generateAnalyticsReport(analyticsData: any): Promise<Blob> {
    const reportData: MedSeniorReportData = {
      title: 'Relatório de Analytics - Centro de Excelência',
      subtitle: 'Métricas e Performance',
      company: 'MedSênior',
      date: new Date().toLocaleDateString('pt-BR'),
      author: 'Sistema MILAPP',
      content: [
        {
          title: 'Resumo Executivo',
          type: 'text',
          data: {
            text: `Este relatório apresenta as métricas de performance do Centro de Excelência em Automação da MedSênior, 
            demonstrando o impacto das automações implementadas e os resultados alcançados.`
          }
        },
        {
          title: 'Métricas Principais',
          type: 'metrics',
          data: {
            total_projects: analyticsData.total_projects || 0,
            active_projects: analyticsData.active_projects || 0,
            completed_projects: analyticsData.completed_projects || 0,
            total_roi: analyticsData.total_roi || 0,
            time_saved: analyticsData.time_saved || 0
          }
        },
        {
          title: 'Projetos por Status',
          type: 'table',
          data: {
            headers: ['Status', 'Quantidade', 'Percentual'],
            rows: [
              ['Ideação', analyticsData.ideation_count || 0, `${((analyticsData.ideation_count || 0) / (analyticsData.total_projects || 1) * 100).toFixed(1)}%`],
              ['Planejamento', analyticsData.planning_count || 0, `${((analyticsData.planning_count || 0) / (analyticsData.total_projects || 1) * 100).toFixed(1)}%`],
              ['Desenvolvimento', analyticsData.development_count || 0, `${((analyticsData.development_count || 0) / (analyticsData.total_projects || 1) * 100).toFixed(1)}%`],
              ['Produção', analyticsData.production_count || 0, `${((analyticsData.production_count || 0) / (analyticsData.total_projects || 1) * 100).toFixed(1)}%`]
            ]
          }
        }
      ],
      footer: 'MILAPP MedSênior - Relatório Gerado Automaticamente'
    }

    return this.generatePDF(reportData)
  }

  // Gerar relatório de discovery
  async generateDiscoveryReport(discoveryData: any): Promise<Blob> {
    const reportData: MedSeniorReportData = {
      title: `Relatório de Discovery - ${discoveryData.process_name}`,
      subtitle: 'Análise Inteligente de Processos',
      company: 'MedSênior',
      date: new Date().toLocaleDateString('pt-BR'),
      author: 'IA Discovery MILAPP',
      content: [
        {
          title: 'Análise do Processo',
          type: 'text',
          data: {
            text: discoveryData.analysis || 'Análise não disponível'
          }
        },
        {
          title: 'Insights Identificados',
          type: 'table',
          data: {
            headers: ['Insight', 'Confiança', 'Impacto'],
            rows: discoveryData.insights?.map((insight: any) => [
              insight.description,
              `${insight.confidence}%`,
              insight.impact
            ]) || []
          }
        },
        {
          title: 'Recomendações',
          type: 'text',
          data: {
            text: discoveryData.recommendations || 'Recomendações não disponíveis'
          }
        },
        {
          title: 'PDD Gerado',
          type: 'text',
          data: {
            text: discoveryData.pdd || 'PDD não disponível'
          }
        }
      ],
      footer: 'MILAPP MedSênior - Discovery IA - bem descobrir bem'
    }

    return this.generatePDF(reportData)
  }

  // Gerar PDF usando jsPDF
  private async generatePDF(reportData: MedSeniorReportData): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    
    let yPosition = margin

    // Cabeçalho com logo MedSênior
    doc.setFillColor(50, 119, 70) // Verde MedSênior
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('MILAPP MedSênior', margin, 25)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Centro de Excelência em Automação', margin, 35)

    yPosition = 60

    // Título do relatório
    doc.setTextColor(50, 119, 70)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(reportData.title, margin, yPosition)
    yPosition += 15

    // Subtítulo
    if (reportData.subtitle) {
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'italic')
      doc.text(reportData.subtitle, margin, yPosition)
      yPosition += 10
    }

    // Informações do relatório
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Empresa: ${reportData.company}`, margin, yPosition)
    doc.text(`Data: ${reportData.date}`, pageWidth - margin - 30, yPosition)
    yPosition += 8
    doc.text(`Autor: ${reportData.author}`, margin, yPosition)
    yPosition += 15

    // Conteúdo do relatório
    for (const section of reportData.content) {
      yPosition = this.addSection(doc, section, yPosition, pageWidth, margin, pageHeight)
      
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }
    }

    // Rodapé
    doc.setFillColor(50, 119, 70)
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(reportData.footer || 'MILAPP MedSênior', margin, pageHeight - 10)
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 30, pageHeight - 10)

    return doc.output('blob')
  }

  // Adicionar seção ao PDF
  private addSection(doc: jsPDF, section: ReportSection, yPosition: number, pageWidth: number, margin: number, pageHeight: number): number {
    // Título da seção
    doc.setTextColor(50, 119, 70)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(section.title, margin, yPosition)
    yPosition += 8

    // Conteúdo baseado no tipo
    switch (section.type) {
      case 'text':
        yPosition = this.addTextSection(doc, section.data, yPosition, pageWidth, margin)
        break
      case 'table':
        yPosition = this.addTableSection(doc, section.data, yPosition, pageWidth, margin)
        break
      case 'metrics':
        yPosition = this.addMetricsSection(doc, section.data, yPosition, pageWidth, margin)
        break
    }

    yPosition += 10
    return yPosition
  }

  // Adicionar seção de texto
  private addTextSection(doc: jsPDF, data: any, yPosition: number, pageWidth: number, margin: number): number {
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    const text = data.text
    const maxWidth = pageWidth - (2 * margin)
    const lines = doc.splitTextToSize(text, maxWidth)
    
    doc.text(lines, margin, yPosition)
    yPosition += (lines.length * 5)
    
    return yPosition
  }

  // Adicionar seção de tabela
  private addTableSection(doc: jsPDF, data: any, yPosition: number, pageWidth: number, margin: number): number {
    const { headers, rows } = data
    const tableWidth = pageWidth - (2 * margin)
    const colWidth = tableWidth / headers.length
    
    // Cabeçalho da tabela
    doc.setFillColor(50, 119, 70)
    doc.rect(margin, yPosition - 5, tableWidth, 10, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    
    headers.forEach((header: string, index: number) => {
      doc.text(header, margin + (index * colWidth) + 2, yPosition + 2)
    })
    
    yPosition += 10

    // Linhas da tabela
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    rows.forEach((row: string[], rowIndex: number) => {
      const rowHeight = 8
      
      // Alternar cores das linhas
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, yPosition - 2, tableWidth, rowHeight, 'F')
      }
      
      row.forEach((cell: string, colIndex: number) => {
        doc.text(cell, margin + (colIndex * colWidth) + 2, yPosition + 5)
      })
      
      yPosition += rowHeight
    })
    
    return yPosition
  }

  // Adicionar seção de métricas
  private addMetricsSection(doc: jsPDF, data: any, yPosition: number, pageWidth: number, margin: number): number {
    const metrics = Object.entries(data)
    const metricsPerRow = 2
    const metricWidth = (pageWidth - (2 * margin) - 20) / metricsPerRow
    const metricHeight = 25
    
    for (let i = 0; i < metrics.length; i += metricsPerRow) {
      const rowMetrics = metrics.slice(i, i + metricsPerRow)
      
      rowMetrics.forEach(([key, value], index) => {
        const x = margin + (index * (metricWidth + 20))
        const y = yPosition
        
        // Fundo da métrica
        doc.setFillColor(240, 248, 240)
        doc.rect(x, y, metricWidth, metricHeight, 'F')
        doc.setDrawColor(50, 119, 70)
        doc.rect(x, y, metricWidth, metricHeight, 'S')
        
        // Título da métrica
        doc.setTextColor(50, 119, 70)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(this.formatMetricKey(key), x + 5, y + 8)
        
        // Valor da métrica
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(String(value), x + 5, y + 18)
      })
      
      yPosition += metricHeight + 10
    }
    
    return yPosition
  }

  // Formatar chave da métrica
  private formatMetricKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Download do PDF
  async downloadPDF(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Preview do PDF
  async previewPDF(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }
} 