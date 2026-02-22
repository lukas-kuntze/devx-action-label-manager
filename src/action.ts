import * as core from '@actions/core';
import * as github from '@actions/github';

import { loadConfig } from './services/config-loader';
import { LabelManager } from './services/label-manager';
import { ActionInputs, ActionOutputs, INPUT, OUTPUT, SyncStats } from './types';
import { validateInputs } from './utils/validators';

/**
 * Retrieves all action inputs from the workflow.
 *
 * @returns The action inputs
 */
function getActionInputs(): ActionInputs {
  return {
    configFile: core.getInput(INPUT.CONFIG_FILE, { required: true }),
    deleteMissing: core.getBooleanInput(INPUT.DELETE_MISSING),
    githubApiUrl: core.getInput(INPUT.GITHUB_API_URL) || undefined,
    githubToken: core.getInput(INPUT.GITHUB_TOKEN, { required: true })
  };
}

/**
 * Logs the action inputs for debugging purposes.
 *
 * @param inputs - The action inputs to log
 */
function logInputs(inputs: ActionInputs): void {
  core.info(`Configuration file: ${inputs.configFile}`);
  core.info(`Delete missing labels: ${inputs.deleteMissing}`);

  if (inputs.githubApiUrl) {
    core.info(`GitHub API URL: ${inputs.githubApiUrl}`);
  }
}

/**
 * Converts synchronization statistics to action outputs.
 *
 * @param stats - The synchronization statistics
 * @returns The action outputs
 */
function mapStatsToOutputs(stats: SyncStats): ActionOutputs {
  return {
    labelsCreated: stats.created,
    labelsUpdated: stats.updated,
    labelsDeleted: stats.deleted,
    labelsSkipped: stats.skipped,
    labelsIgnored: stats.ignored
  };
}

/**
 * Sets the action outputs based on the synchronization statistics.
 *
 * @param stats - The synchronization statistics
 * @returns The action outputs that were set
 */
function setOutputs(stats: SyncStats): ActionOutputs {
  const outputs = mapStatsToOutputs(stats);

  core.setOutput(OUTPUT.LABELS_CREATED, outputs.labelsCreated.toString());
  core.setOutput(OUTPUT.LABELS_UPDATED, outputs.labelsUpdated.toString());
  core.setOutput(OUTPUT.LABELS_DELETED, outputs.labelsDeleted.toString());
  core.setOutput(OUTPUT.LABELS_SKIPPED, outputs.labelsSkipped.toString());
  core.setOutput(OUTPUT.LABELS_IGNORED, outputs.labelsIgnored.toString());

  return outputs;
}

/**
 * Main entry point for the GitHub Action.
 *
 * Orchestrates the label synchronization process:
 * 1. Loads and validates configuration
 * 2. Synchronizes labels with the repository
 * 3. Reports results as action outputs
 */
async function run(): Promise<void> {
  try {
    core.info('Starting GitHub Label Manager Action.');

    core.startGroup('Configuration');
    const inputs = getActionInputs();
    logInputs(inputs);
    validateInputs(inputs);
    const { owner, repo } = github.context.repo;
    core.info(`Repository: ${owner}/${repo}`);
    core.endGroup();

    core.startGroup('Synchronization');
    const config = await loadConfig(inputs.configFile, inputs.githubToken);
    const labelManager = new LabelManager(inputs.githubToken, owner, repo, inputs.githubApiUrl);
    const stats = await labelManager.syncLabels(config.labels, inputs.deleteMissing);
    core.endGroup();

    core.startGroup('Results');
    setOutputs(stats);
    core.endGroup();

    core.info('GitHub Label Manager Action completed successfully.');
  } catch (error) {
    if (error instanceof Error) {
      core.debug(`Stack trace: ${error.stack}`);
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed(`Action failed: ${String(error)}`);
    }
  }
}

void run();
