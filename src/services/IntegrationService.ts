import axios from 'axios';

// Interfaces para dados extraídos das integrações
interface GitMetrics {
  total_commits: number;
  commits_by_author: { [author: string]: number };
  commits_by_date: { [date: string]: number };
  lines_added: number;
  lines_deleted: number;
  files_changed: number;
  branches: BranchInfo[];
  recent_commits: CommitInfo[];
  code_churn: number;
  commit_frequency: number;
}

interface BranchInfo {
  name: string;
  last_commit: string;
  commits_ahead: number;
  commits_behind: number;
  is_active: boolean;
}

interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  files_changed: number;
  lines_added: number;
  lines_deleted: number;
  branch: string;
}

interface GitHubMetrics {
  pull_requests: PullRequestInfo[];
  issues: IssueInfo[];
  releases: ReleaseInfo[];
  repository_stats: RepositoryStats;
  contributors: ContributorInfo[];
  code_reviews: CodeReviewInfo[];
  deployment_status: DeploymentStatus[];
}

interface PullRequestInfo {
  id: number;
  title: string;
  author: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  merged_at?: string;
  closed_at?: string;
  review_count: number;
  comment_count: number;
  files_changed: number;
  additions: number;
  deletions: number;
  labels: string[];
  reviewers: string[];
}

interface IssueInfo {
  id: number;
  title: string;
  author: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
  labels: string[];
  assignees: string[];
  comment_count: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ReleaseInfo {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  download_count: number;
  assets: ReleaseAsset[];
}

interface ReleaseAsset {
  name: string;
  download_count: number;
  size: number;
}

interface RepositoryStats {
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  size: number;
  language: string;
  last_updated: string;
}

interface ContributorInfo {
  username: string;
  contributions: number;
  avatar_url: string;
  last_contribution: string;
}

interface CodeReviewInfo {
  id: number;
  reviewer: string;
  state: 'approved' | 'changes_requested' | 'commented';
  submitted_at: string;
  comments: number;
}

interface DeploymentStatus {
  id: number;
  environment: string;
  state: 'success' | 'failure' | 'pending';
  created_at: string;
  updated_at: string;
  description: string;
}

interface DockerMetrics {
  containers: ContainerInfo[];
  images: ImageInfo[];
  volumes: VolumeInfo[];
  networks: NetworkInfo[];
  resource_usage: ResourceUsage;
  build_history: BuildInfo[];
}

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'exited';
  created: string;
  ports: string[];
  volumes: string[];
  cpu_usage: number;
  memory_usage: number;
  network_usage: number;
}

interface ImageInfo {
  id: string;
  name: string;
  tag: string;
  size: number;
  created: string;
  layers: number;
  vulnerabilities: VulnerabilityInfo[];
}

interface VulnerabilityInfo {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cve_id?: string;
  package: string;
}

interface VolumeInfo {
  name: string;
  driver: string;
  size: number;
  mountpoint: string;
}

interface NetworkInfo {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: number;
}

interface ResourceUsage {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_in: number;
  network_out: number;
}

interface BuildInfo {
  id: string;
  image: string;
  status: 'success' | 'failure' | 'building';
  created_at: string;
  duration: number;
  size: number;
}

interface N8nMetrics {
  workflows: WorkflowInfo[];
  executions: ExecutionInfo[];
  nodes: NodeInfo[];
  credentials: CredentialInfo[];
  performance_metrics: N8nPerformanceMetrics;
}

interface WorkflowInfo {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  nodes_count: number;
  executions_count: number;
  success_rate: number;
  avg_execution_time: number;
}

interface ExecutionInfo {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'success' | 'failure' | 'running' | 'waiting';
  started_at: string;
  finished_at?: string;
  duration: number;
  nodes_executed: number;
  error_message?: string;
}

interface NodeInfo {
  id: string;
  name: string;
  type: string;
  workflow_id: string;
  execution_count: number;
  success_rate: number;
  avg_execution_time: number;
}

interface CredentialInfo {
  id: string;
  name: string;
  type: string;
  created_at: string;
  last_used?: string;
}

interface N8nPerformanceMetrics {
  total_executions: number;
  success_rate: number;
  avg_execution_time: number;
  peak_executions_per_hour: number;
  error_rate: number;
}

interface PythonMetrics {
  dependencies: DependencyInfo[];
  test_coverage: TestCoverageInfo;
  code_quality: CodeQualityInfo;
  performance_metrics: PythonPerformanceMetrics;
  security_scan: SecurityScanInfo;
}

interface DependencyInfo {
  name: string;
  version: string;
  latest_version: string;
  is_outdated: boolean;
  license: string;
  vulnerabilities: VulnerabilityInfo[];
  usage_count: number;
}

interface TestCoverageInfo {
  total_coverage: number;
  line_coverage: number;
  branch_coverage: number;
  function_coverage: number;
  uncovered_lines: number[];
  test_count: number;
  test_duration: number;
}

interface CodeQualityInfo {
  pylint_score: number;
  flake8_issues: number;
  black_compliance: number;
  mypy_errors: number;
  complexity_score: number;
  maintainability_index: number;
  technical_debt: number;
}

interface PythonPerformanceMetrics {
  execution_time: number;
  memory_usage: number;
  cpu_usage: number;
  response_time: number;
  throughput: number;
}

interface SecurityScanInfo {
  vulnerabilities: VulnerabilityInfo[];
  security_score: number;
  last_scan: string;
  scan_duration: number;
}

interface TimeTrackingData {
  user_id: string;
  project_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  description: string;
  category: string;
  tags: string[];
}

interface IntegrationConfig {
  github: {
    token: string;
    repository: string;
    owner: string;
  };
  docker: {
    host: string;
    port: number;
    api_version: string;
  };
  n8n: {
    base_url: string;
    api_key: string;
  };
  python: {
    project_path: string;
    requirements_file: string;
  };
  git: {
    repository_path: string;
  };
}

class IntegrationService {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  // GitHub Integration
  async getGitHubMetrics(): Promise<GitHubMetrics> {
    try {
      const headers = {
        'Authorization': `token ${this.config.github.token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const baseUrl = `https://api.github.com/repos/${this.config.github.owner}/${this.config.github.repository}`;

      // Fetch repository stats
      const repoResponse = await axios.get(baseUrl, { headers });
      const repository_stats: RepositoryStats = {
        stars: repoResponse.data.stargazers_count,
        forks: repoResponse.data.forks_count,
        watchers: repoResponse.data.watchers_count,
        open_issues: repoResponse.data.open_issues_count,
        size: repoResponse.data.size,
        language: repoResponse.data.language,
        last_updated: repoResponse.data.updated_at
      };

      // Fetch pull requests
      const prResponse = await axios.get(`${baseUrl}/pulls?state=all&per_page=100`, { headers });
      const pull_requests: PullRequestInfo[] = prResponse.data.map((pr: any) => ({
        id: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.merged_at ? 'merged' : pr.state,
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        closed_at: pr.closed_at,
        review_count: 0, // Would need additional API call
        comment_count: pr.comments,
        files_changed: 0, // Would need additional API call
        additions: 0, // Would need additional API call
        deletions: 0, // Would need additional API call
        labels: pr.labels.map((label: any) => label.name),
        reviewers: [] // Would need additional API call
      }));

      // Fetch issues
      const issuesResponse = await axios.get(`${baseUrl}/issues?state=all&per_page=100`, { headers });
      const issues: IssueInfo[] = issuesResponse.data
        .filter((issue: any) => !issue.pull_request) // Exclude PRs
        .map((issue: any) => ({
          id: issue.number,
          title: issue.title,
          author: issue.user.login,
          state: issue.state,
          created_at: issue.created_at,
          closed_at: issue.closed_at,
          labels: issue.labels.map((label: any) => label.name),
          assignees: issue.assignees.map((assignee: any) => assignee.login),
          comment_count: issue.comments,
          priority: this.extractPriorityFromLabels(issue.labels)
        }));

      // Fetch contributors
      const contributorsResponse = await axios.get(`${baseUrl}/contributors`, { headers });
      const contributors: ContributorInfo[] = contributorsResponse.data.map((contributor: any) => ({
        username: contributor.login,
        contributions: contributor.contributions,
        avatar_url: contributor.avatar_url,
        last_contribution: new Date().toISOString() // Would need additional logic
      }));

      return {
        pull_requests,
        issues,
        releases: [], // Would need additional API call
        repository_stats,
        contributors,
        code_reviews: [], // Would need additional API call
        deployment_status: [] // Would need additional API call
      };
    } catch (error) {
      console.error('Error fetching GitHub metrics:', error);
      throw new Error('Failed to fetch GitHub metrics');
    }
  }

  private extractPriorityFromLabels(labels: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const priorityLabels = labels.map(label => label.name.toLowerCase());
    if (priorityLabels.includes('critical')) return 'critical';
    if (priorityLabels.includes('high')) return 'high';
    if (priorityLabels.includes('medium')) return 'medium';
    return 'low';
  }

  // Git Integration
  async getGitMetrics(): Promise<GitMetrics> {
    try {
      // This would typically use a Git library like simple-git
      // For now, we'll simulate the data structure
      const gitMetrics: GitMetrics = {
        total_commits: 0,
        commits_by_author: {},
        commits_by_date: {},
        lines_added: 0,
        lines_deleted: 0,
        files_changed: 0,
        branches: [],
        recent_commits: [],
        code_churn: 0,
        commit_frequency: 0
      };

      // In a real implementation, you would:
      // 1. Use simple-git or similar library
      // 2. Execute git commands and parse output
      // 3. Calculate metrics from git log, git diff, etc.

      return gitMetrics;
    } catch (error) {
      console.error('Error fetching Git metrics:', error);
      throw new Error('Failed to fetch Git metrics');
    }
  }

  // Docker Integration
  async getDockerMetrics(): Promise<DockerMetrics> {
    try {
      const dockerUrl = `http://${this.config.docker.host}:${this.config.docker.port}/v${this.config.docker.api_version}`;

      // Fetch containers
      const containersResponse = await axios.get(`${dockerUrl}/containers/json?all=true`);
      const containers: ContainerInfo[] = containersResponse.data.map((container: any) => ({
        id: container.Id,
        name: container.Names[0],
        image: container.Image,
        status: container.State,
        created: new Date(container.Created * 1000).toISOString(),
        ports: container.Ports?.map((port: any) => `${port.PrivatePort}:${port.PublicPort}`) || [],
        volumes: container.Mounts?.map((mount: any) => mount.Source) || [],
        cpu_usage: 0, // Would need additional API call
        memory_usage: 0, // Would need additional API call
        network_usage: 0 // Would need additional API call
      }));

      // Fetch images
      const imagesResponse = await axios.get(`${dockerUrl}/images/json`);
      const images: ImageInfo[] = imagesResponse.data.map((image: any) => ({
        id: image.Id,
        name: image.RepoTags?.[0] || 'none',
        tag: image.RepoTags?.[0]?.split(':')[1] || 'latest',
        size: image.Size,
        created: new Date(image.Created * 1000).toISOString(),
        layers: image.Layers?.length || 0,
        vulnerabilities: [] // Would need security scan integration
      }));

      return {
        containers,
        images,
        volumes: [], // Would need additional API call
        networks: [], // Would need additional API call
        resource_usage: {
          cpu_percent: 0,
          memory_percent: 0,
          disk_percent: 0,
          network_in: 0,
          network_out: 0
        },
        build_history: [] // Would need additional API call
      };
    } catch (error) {
      console.error('Error fetching Docker metrics:', error);
      throw new Error('Failed to fetch Docker metrics');
    }
  }

  // n8n Integration
  async getN8nMetrics(): Promise<N8nMetrics> {
    try {
      const headers = {
        'X-N8N-API-KEY': this.config.n8n.api_key,
        'Content-Type': 'application/json'
      };

      // Fetch workflows
      const workflowsResponse = await axios.get(`${this.config.n8n.base_url}/api/v1/workflows`, { headers });
      const workflows: WorkflowInfo[] = workflowsResponse.data.data.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        created_at: workflow.createdAt,
        updated_at: workflow.updatedAt,
        nodes_count: workflow.nodes?.length || 0,
        executions_count: 0, // Would need additional API call
        success_rate: 0, // Would need additional API call
        avg_execution_time: 0 // Would need additional API call
      }));

      // Fetch executions
      const executionsResponse = await axios.get(`${this.config.n8n.base_url}/api/v1/executions`, { headers });
      const executions: ExecutionInfo[] = executionsResponse.data.data.map((execution: any) => ({
        id: execution.id,
        workflow_id: execution.workflowId,
        workflow_name: '', // Would need to map from workflow
        status: execution.finished ? (execution.success ? 'success' : 'failure') : 'running',
        started_at: execution.startedAt,
        finished_at: execution.finishedAt,
        duration: execution.finishedAt ? new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime() : 0,
        nodes_executed: execution.data?.resultData?.runData ? Object.keys(execution.data.resultData.runData).length : 0,
        error_message: execution.data?.resultData?.error?.message
      }));

      return {
        workflows,
        executions,
        nodes: [], // Would need additional processing
        credentials: [], // Would need additional API call
        performance_metrics: {
          total_executions: executions.length,
          success_rate: executions.filter(e => e.status === 'success').length / executions.length * 100,
          avg_execution_time: executions.reduce((sum, e) => sum + e.duration, 0) / executions.length,
          peak_executions_per_hour: 0, // Would need additional calculation
          error_rate: executions.filter(e => e.status === 'failure').length / executions.length * 100
        }
      };
    } catch (error) {
      console.error('Error fetching n8n metrics:', error);
      throw new Error('Failed to fetch n8n metrics');
    }
  }

  // Python Integration
  async getPythonMetrics(): Promise<PythonMetrics> {
    try {
      // This would typically use Python subprocess or similar to run analysis tools
      const pythonMetrics: PythonMetrics = {
        dependencies: [],
        test_coverage: {
          total_coverage: 0,
          line_coverage: 0,
          branch_coverage: 0,
          function_coverage: 0,
          uncovered_lines: [],
          test_count: 0,
          test_duration: 0
        },
        code_quality: {
          pylint_score: 0,
          flake8_issues: 0,
          black_compliance: 0,
          mypy_errors: 0,
          complexity_score: 0,
          maintainability_index: 0,
          technical_debt: 0
        },
        performance_metrics: {
          execution_time: 0,
          memory_usage: 0,
          cpu_usage: 0,
          response_time: 0,
          throughput: 0
        },
        security_scan: {
          vulnerabilities: [],
          security_score: 0,
          last_scan: new Date().toISOString(),
          scan_duration: 0
        }
      };

      // In a real implementation, you would:
      // 1. Run pip list to get dependencies
      // 2. Run coverage.py for test coverage
      // 3. Run pylint, flake8, black, mypy for code quality
      // 4. Run security tools like bandit or safety
      // 5. Parse the output and populate the metrics

      return pythonMetrics;
    } catch (error) {
      console.error('Error fetching Python metrics:', error);
      throw new Error('Failed to fetch Python metrics');
    }
  }

  // Time Tracking Integration
  async getTimeTrackingData(startDate: string, endDate: string): Promise<TimeTrackingData[]> {
    try {
      // This would integrate with time tracking tools like:
      // - Toggl
      // - Harvest
      // - Clockify
      // - Jira time tracking
      // - Custom time tracking system

      const timeTrackingData: TimeTrackingData[] = [];

      // Example integration with Toggl
      // const togglResponse = await axios.get(`https://api.track.toggl.com/api/v8/time_entries?start_date=${startDate}&end_date=${endDate}`, {
      //   auth: {
      //     username: this.config.toggl.api_token,
      //     password: 'api_token'
      //   }
      // });

      return timeTrackingData;
    } catch (error) {
      console.error('Error fetching time tracking data:', error);
      throw new Error('Failed to fetch time tracking data');
    }
  }

  // Combined Metrics Dashboard
  async getCombinedMetrics(): Promise<{
    git: GitMetrics;
    github: GitHubMetrics;
    docker: DockerMetrics;
    n8n: N8nMetrics;
    python: PythonMetrics;
    timeTracking: TimeTrackingData[];
  }> {
    try {
      const [git, github, docker, n8n, python, timeTracking] = await Promise.all([
        this.getGitMetrics(),
        this.getGitHubMetrics(),
        this.getDockerMetrics(),
        this.getN8nMetrics(),
        this.getPythonMetrics(),
        this.getTimeTrackingData(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          new Date().toISOString()
        )
      ]);

      return {
        git,
        github,
        docker,
        n8n,
        python,
        timeTracking
      };
    } catch (error) {
      console.error('Error fetching combined metrics:', error);
      throw new Error('Failed to fetch combined metrics');
    }
  }

  // Real-time Monitoring
  async startRealTimeMonitoring(callback: (metrics: any) => void): Promise<void> {
    // This would set up WebSocket connections or polling for real-time updates
    setInterval(async () => {
      try {
        const metrics = await this.getCombinedMetrics();
        callback(metrics);
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 60000); // Update every minute
  }
}

export default IntegrationService;
export type {
  GitMetrics,
  GitHubMetrics,
  DockerMetrics,
  N8nMetrics,
  PythonMetrics,
  TimeTrackingData,
  IntegrationConfig
}; 