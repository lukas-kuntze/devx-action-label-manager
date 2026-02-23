/**
 * Configuration for a single GitHub label.
 */
export interface Label {
  /** Name of the label */
  name: string;

  /** Description shown in GitHub */
  description?: string;

  /** Hex color value without leading '#' */
  color: string;

  /** If true, the label is ignored during processing */
  ignore?: boolean;
}

/**
 * Structure of the YAML configuration file.
 */
export interface LabelConfig {
  /** List of label definitions */
  labels: Label[];
}

/**
 * Input parameters for the GitHub Action.
 */
export interface ActionInputs {
  /** Path to the configuration file (local, URL, or repo path) */
  configFile: string;

  /** Whether to delete labels not present in the configuration */
  deleteMissing: boolean;

  /** Base URL of the GitHub API (for GitHub Enterprise Server) */
  githubApiUrl?: string;

  /** GitHub token used for API authentication */
  githubToken: string;
}

/**
 * Output values of the GitHub Action.
 */
export interface ActionOutputs {
  /** Number of labels created */
  labelsCreated: number;

  /** Number of labels updated */
  labelsUpdated: number;

  /** Number of labels deleted */
  labelsDeleted: number;

  /** Number of labels skipped (already up-to-date) */
  labelsSkipped: number;

  /** Number of labels ignored due to ignore flag */
  labelsIgnored: number;
}

/**
 * Input parameter names for the GitHub Action.
 */
export const INPUT = {
  CONFIG_FILE: 'config_file',
  DELETE_MISSING: 'delete_missing',
  GITHUB_API_URL: 'github_api_url',
  GITHUB_TOKEN: 'github_token'
} as const;

/**
 * Output parameter names for the GitHub Action.
 */
export const OUTPUT = {
  LABELS_CREATED: 'labels_created',
  LABELS_UPDATED: 'labels_updated',
  LABELS_DELETED: 'labels_deleted',
  LABELS_SKIPPED: 'labels_skipped',
  LABELS_IGNORED: 'labels_ignored'
} as const;

/**
 * Statistics about label synchronization.
 */
export interface SyncStats {
  /** Number of labels created */
  created: number;

  /** Number of labels updated */
  updated: number;

  /** Number of labels deleted */
  deleted: number;

  /** Number of labels skipped (already up-to-date) */
  skipped: number;

  /** Number of labels ignored due to ignore flag */
  ignored: number;
}

/**
 * Represents a label returned by the GitHub API.
 */
export interface GitHubLabel {
  /** Unique label ID */
  id: number;

  /** Label name */
  name: string;

  /** Label description or null */
  description: string | null;

  /** Hex color value without '#' */
  color: string;

  /** Whether this is a default GitHub label */
  default: boolean;

  /** GitHub node identifier */
  node_id: string;

  /** API URL of the label */
  url: string;
}
