"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_loader_1 = require("./services/config-loader");
const label_manager_1 = require("./services/label-manager");
const types_1 = require("./types");
const validators_1 = require("./utils/validators");
/**
 * Retrieves all action inputs from the workflow.
 *
 * @returns The action inputs
 */
function getActionInputs() {
    return {
        configFile: core.getInput(types_1.INPUT.CONFIG_FILE, { required: true }),
        deleteMissing: core.getBooleanInput(types_1.INPUT.DELETE_MISSING),
        githubApiUrl: core.getInput(types_1.INPUT.GITHUB_API_URL) || undefined,
        githubToken: core.getInput(types_1.INPUT.GITHUB_TOKEN, { required: true })
    };
}
/**
 * Logs the action inputs for debugging purposes.
 *
 * @param inputs - The action inputs to log
 */
function logInputs(inputs) {
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
function mapStatsToOutputs(stats) {
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
function setOutputs(stats) {
    const outputs = mapStatsToOutputs(stats);
    core.setOutput(types_1.OUTPUT.LABELS_CREATED, outputs.labelsCreated.toString());
    core.setOutput(types_1.OUTPUT.LABELS_UPDATED, outputs.labelsUpdated.toString());
    core.setOutput(types_1.OUTPUT.LABELS_DELETED, outputs.labelsDeleted.toString());
    core.setOutput(types_1.OUTPUT.LABELS_SKIPPED, outputs.labelsSkipped.toString());
    core.setOutput(types_1.OUTPUT.LABELS_IGNORED, outputs.labelsIgnored.toString());
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
async function run() {
    try {
        core.info('Starting GitHub Label Manager Action.');
        core.startGroup('Configuration');
        const inputs = getActionInputs();
        logInputs(inputs);
        (0, validators_1.validateInputs)(inputs);
        const { owner, repo } = github.context.repo;
        core.info(`Repository: ${owner}/${repo}`);
        core.endGroup();
        core.startGroup('Synchronization');
        const config = await (0, config_loader_1.loadConfig)(inputs.configFile, inputs.githubToken);
        const labelManager = new label_manager_1.LabelManager(inputs.githubToken, owner, repo, inputs.githubApiUrl);
        const stats = await labelManager.syncLabels(config.labels, inputs.deleteMissing);
        core.endGroup();
        core.startGroup('Results');
        setOutputs(stats);
        core.endGroup();
        core.info('GitHub Label Manager Action completed successfully.');
    }
    catch (error) {
        if (error instanceof Error) {
            core.debug(`Stack trace: ${error.stack}`);
            core.setFailed(`Action failed: ${error.message}`);
        }
        else {
            core.setFailed(`Action failed: ${String(error)}`);
        }
    }
}
void run();
//# sourceMappingURL=action.js.map