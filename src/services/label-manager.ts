import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

import { GitHubLabel, Label, SyncStats } from '../types';

/** Maximum number of labels to fetch per API request. */
const LABELS_PER_PAGE = 100;

/**
 * Manages GitHub repository labels via the GitHub API.
 */
export class LabelManager {
  private octokit: InstanceType<typeof GitHub>;
  private owner: string;
  private repo: string;

  /**
   * Creates a new LabelManager instance.
   *
   * @param token - GitHub token used for authentication
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param apiUrl - Base URL of the GitHub API (for GitHub Enterprise)
   */
  constructor(token: string, owner: string, repo: string, apiUrl?: string) {
    this.octokit = getOctokit(token, { baseUrl: apiUrl });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Fetches all existing labels from the repository.
   * Handles pagination to retrieve more than 100 labels.
   *
   * @returns Array of existing GitHub labels
   */
  async getExistingLabels(): Promise<GitHubLabel[]> {
    core.info('Fetching existing labels from the repository...');

    try {
      const labels = await this.octokit.paginate(this.octokit.rest.issues.listLabelsForRepo, {
        owner: this.owner,
        repo: this.repo,
        per_page: LABELS_PER_PAGE
      });

      core.info(`Found ${labels.length} existing labels.`);
      return labels as GitHubLabel[];
    } catch (error) {
      throw new Error(`Failed to fetch existing labels: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a new label in the repository.
   *
   * @param label - Label to create
   */
  async createLabel(label: Label): Promise<void> {
    core.info(`Creating label "${label.name}"...`);

    try {
      await this.octokit.rest.issues.createLabel({
        owner: this.owner,
        repo: this.repo,
        name: label.name,
        color: label.color,
        description: label.description || ''
      });

      core.info(`Label "${label.name}" created successfully.`);
    } catch (error) {
      throw new Error(`Failed to create label "${label.name}": ${(error as Error).message}`);
    }
  }

  /**
   * Updates an existing label in the repository.
   *
   * @param oldName - Current name of the label
   * @param label - New label configuration
   */
  async updateLabel(oldName: string, label: Label): Promise<void> {
    core.info(`Updating label "${oldName}"...`);

    try {
      await this.octokit.rest.issues.updateLabel({
        owner: this.owner,
        repo: this.repo,
        name: oldName,
        new_name: label.name,
        color: label.color,
        description: label.description || ''
      });

      core.info(`Label "${label.name}" updated successfully.`);
    } catch (error) {
      throw new Error(`Failed to update label "${oldName}": ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a label from the repository.
   *
   * @param name - Name of the label to delete
   */
  async deleteLabel(name: string): Promise<void> {
    core.info(`Deleting label "${name}"...`);

    try {
      await this.octokit.rest.issues.deleteLabel({
        owner: this.owner,
        repo: this.repo,
        name
      });

      core.info(`Label "${name}" deleted successfully.`);
    } catch (error) {
      throw new Error(`Failed to delete label "${name}": ${(error as Error).message}`);
    }
  }

  /**
   * Checks whether a label needs to be updated.
   *
   * @param existing - Existing GitHub label
   * @param desired - Desired label configuration
   * @returns True if the label must be updated
   */
  private needsUpdate(existing: GitHubLabel, desired: Label): boolean {
    const colorMatch = existing.color.toUpperCase() === desired.color.toUpperCase();
    const descriptionMatch = (existing.description || '') === (desired.description || '');
    const nameMatch = existing.name === desired.name;

    return !colorMatch || !descriptionMatch || !nameMatch;
  }

  /**
   * Synchronizes repository labels with the desired configuration.
   *
   * @param desiredLabels - Array of desired label configurations
   * @param deleteMissing - Whether to delete labels not included in the configuration
   * @returns Statistics about the synchronization
   */
  async syncLabels(desiredLabels: Label[], deleteMissing: boolean): Promise<SyncStats> {
    const stats: SyncStats = {
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      ignored: 0
    };

    core.info('Starting label synchronization...');

    const existingLabels = await this.getExistingLabels();
    const existingLabelMap = new Map<string, GitHubLabel>();

    for (const label of existingLabels) {
      existingLabelMap.set(label.name.toLowerCase(), label);
    }

    const activeLabels = desiredLabels.filter((label) => !label.ignore);
    const ignoredLabels = desiredLabels.filter((label) => label.ignore);

    stats.ignored = ignoredLabels.length;
    if (ignoredLabels.length > 0) {
      core.info(`Ignoring ${ignoredLabels.length} labels: ${ignoredLabels.map((l) => l.name).join(', ')}.`);
    }

    for (const label of activeLabels) {
      const existing = existingLabelMap.get(label.name.toLowerCase());

      if (!existing) {
        await this.createLabel(label);
        stats.created++;
      } else if (this.needsUpdate(existing, label)) {
        await this.updateLabel(existing.name, label);
        stats.updated++;
      } else {
        core.debug(`Label "${label.name}" is already up to date.`);
        stats.skipped++;
      }

      existingLabelMap.delete(label.name.toLowerCase());
    }

    if (deleteMissing && existingLabelMap.size > 0) {
      core.info(`Deleting ${existingLabelMap.size} labels not present in the configuration.`);

      for (const [, label] of existingLabelMap) {
        await this.deleteLabel(label.name);
        stats.deleted++;
      }
    } else if (existingLabelMap.size > 0) {
      core.info(
        `${existingLabelMap.size} labels exist in the repository but not in the configuration (delete_missing=false).`
      );
    }

    this.logSummary(stats);

    return stats;
  }

  /**
   * Logs the synchronization summary.
   *
   * @param stats - The synchronization statistics
   */
  private logSummary(stats: SyncStats): void {
    core.info('=== Synchronization Summary ===');
    core.info(`Created: ${stats.created}`);
    core.info(`Updated: ${stats.updated}`);
    core.info(`Deleted: ${stats.deleted}`);
    core.info(`Skipped: ${stats.skipped}`);
    core.info(`Ignored: ${stats.ignored}`);
    core.info('===============================');
  }
}
