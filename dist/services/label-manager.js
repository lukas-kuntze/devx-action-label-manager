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
exports.LabelManager = void 0;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
/** Maximum number of labels to fetch per API request. */
const LABELS_PER_PAGE = 100;
/**
 * Manages GitHub repository labels via the GitHub API.
 */
class LabelManager {
    octokit;
    owner;
    repo;
    /**
     * Creates a new LabelManager instance.
     *
     * @param token - GitHub token used for authentication
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param apiUrl - Base URL of the GitHub API (for GitHub Enterprise)
     */
    constructor(token, owner, repo, apiUrl) {
        this.octokit = (0, github_1.getOctokit)(token, { baseUrl: apiUrl });
        this.owner = owner;
        this.repo = repo;
    }
    /**
     * Fetches all existing labels from the repository.
     * Handles pagination to retrieve more than 100 labels.
     *
     * @returns Array of existing GitHub labels
     */
    async getExistingLabels() {
        core.info('Fetching existing labels from the repository...');
        try {
            const labels = await this.octokit.paginate(this.octokit.rest.issues.listLabelsForRepo, {
                owner: this.owner,
                repo: this.repo,
                per_page: LABELS_PER_PAGE
            });
            core.info(`Found ${labels.length} existing labels.`);
            return labels;
        }
        catch (error) {
            throw new Error(`Failed to fetch existing labels: ${error.message}`);
        }
    }
    /**
     * Creates a new label in the repository.
     *
     * @param label - Label to create
     */
    async createLabel(label) {
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
        }
        catch (error) {
            throw new Error(`Failed to create label "${label.name}": ${error.message}`);
        }
    }
    /**
     * Updates an existing label in the repository.
     *
     * @param oldName - Current name of the label
     * @param label - New label configuration
     */
    async updateLabel(oldName, label) {
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
        }
        catch (error) {
            throw new Error(`Failed to update label "${oldName}": ${error.message}`);
        }
    }
    /**
     * Deletes a label from the repository.
     *
     * @param name - Name of the label to delete
     */
    async deleteLabel(name) {
        core.info(`Deleting label "${name}"...`);
        try {
            await this.octokit.rest.issues.deleteLabel({
                owner: this.owner,
                repo: this.repo,
                name
            });
            core.info(`Label "${name}" deleted successfully.`);
        }
        catch (error) {
            throw new Error(`Failed to delete label "${name}": ${error.message}`);
        }
    }
    /**
     * Checks whether a label needs to be updated.
     *
     * @param existing - Existing GitHub label
     * @param desired - Desired label configuration
     * @returns True if the label must be updated
     */
    needsUpdate(existing, desired) {
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
    async syncLabels(desiredLabels, deleteMissing) {
        const stats = {
            created: 0,
            updated: 0,
            deleted: 0,
            skipped: 0,
            ignored: 0
        };
        core.info('Starting label synchronization...');
        const existingLabels = await this.getExistingLabels();
        const existingLabelMap = new Map();
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
            }
            else if (this.needsUpdate(existing, label)) {
                await this.updateLabel(existing.name, label);
                stats.updated++;
            }
            else {
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
        }
        else if (existingLabelMap.size > 0) {
            core.info(`${existingLabelMap.size} labels exist in the repository but not in the configuration (delete_missing=false).`);
        }
        this.logSummary(stats);
        return stats;
    }
    /**
     * Logs the synchronization summary.
     *
     * @param stats - The synchronization statistics
     */
    logSummary(stats) {
        core.info('=== Synchronization Summary ===');
        core.info(`Created: ${stats.created}`);
        core.info(`Updated: ${stats.updated}`);
        core.info(`Deleted: ${stats.deleted}`);
        core.info(`Skipped: ${stats.skipped}`);
        core.info(`Ignored: ${stats.ignored}`);
        core.info('===============================');
    }
}
exports.LabelManager = LabelManager;
//# sourceMappingURL=label-manager.js.map