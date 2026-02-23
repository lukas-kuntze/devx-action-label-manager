"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT = exports.INPUT = void 0;
/**
 * Input parameter names for the GitHub Action.
 */
exports.INPUT = {
    CONFIG_FILE: 'config_file',
    DELETE_MISSING: 'delete_missing',
    GITHUB_API_URL: 'github_api_url',
    GITHUB_TOKEN: 'github_token'
};
/**
 * Output parameter names for the GitHub Action.
 */
exports.OUTPUT = {
    LABELS_CREATED: 'labels_created',
    LABELS_UPDATED: 'labels_updated',
    LABELS_DELETED: 'labels_deleted',
    LABELS_SKIPPED: 'labels_skipped',
    LABELS_IGNORED: 'labels_ignored'
};
//# sourceMappingURL=index.js.map