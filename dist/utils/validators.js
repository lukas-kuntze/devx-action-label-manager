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
exports.validateColor = validateColor;
exports.validateLabelName = validateLabelName;
exports.validateLabel = validateLabel;
exports.validateLabelConfig = validateLabelConfig;
exports.validateInputs = validateInputs;
const core = __importStar(require("@actions/core"));
/** Maximum allowed length for a label name. */
const MAX_LABEL_NAME_LENGTH = 50;
/** Maximum allowed length for a label description before GitHub truncates it. */
const MAX_LABEL_DESCRIPTION_LENGTH = 100;
/** Regular expression for validating 6-digit hex color codes. */
const HEX_COLOR_REGEX = /^[0-9A-Fa-f]{6}$/;
/**
 * Validates a hex color code.
 *
 * @param color - Color value to validate (with or without '#')
 * @returns Hex color without the leading '#'
 * @throws Error if the value is not a valid hex color
 */
function validateColor(color) {
    const cleanColor = color.replace(/^#/, '');
    if (!HEX_COLOR_REGEX.test(cleanColor)) {
        throw new Error(`Invalid color code: "${color}". Expected a 6-digit hex value (e.g. "#FF0000" or "FF0000").`);
    }
    return cleanColor.toUpperCase();
}
/**
 * Validates a label name.
 *
 * @param name - Label name to validate
 * @throws Error if the name is invalid
 */
function validateLabelName(name) {
    if (!name || name.trim().length === 0) {
        throw new Error('Label name cannot be empty.');
    }
    if (name.length > MAX_LABEL_NAME_LENGTH) {
        throw new Error(`Label name "${name}" is too long. Maximum length is ${MAX_LABEL_NAME_LENGTH} characters.`);
    }
}
/**
 * Validates a single label configuration.
 *
 * @param label - The label to validate
 * @param index - The index of the label in the array (for error messages)
 * @throws Error if the label is invalid
 */
function validateLabel(label, index) {
    if (!label.name) {
        throw new Error(`Label at index ${index} is missing the "name" field.`);
    }
    if (!label.color) {
        throw new Error(`Label "${label.name}" is missing the "color" field.`);
    }
    validateLabelName(label.name);
    try {
        validateColor(label.color);
    }
    catch (error) {
        throw new Error(`Error in label "${label.name}": ${error.message}`);
    }
    if (label.description && label.description.length > MAX_LABEL_DESCRIPTION_LENGTH) {
        core.warning(`Label "${label.name}" has a description over ${MAX_LABEL_DESCRIPTION_LENGTH} characters. GitHub may truncate it.`);
    }
}
/**
 * Validates the entire label configuration.
 *
 * @param config - Label configuration to validate
 * @throws Error if the configuration is invalid
 */
function validateLabelConfig(config) {
    if (!config) {
        throw new Error('Configuration must not be null or undefined.');
    }
    if (!config.labels) {
        throw new Error('Configuration is missing the required "labels" array.');
    }
    if (!Array.isArray(config.labels)) {
        throw new TypeError('Configuration property "labels" must be an array.');
    }
    if (config.labels.length === 0) {
        core.warning('Configuration does not contain any labels.');
        return;
    }
    config.labels.forEach((label, index) => {
        validateLabel(label, index);
    });
    const labelNames = config.labels.map((l) => l.name.toLowerCase());
    const duplicates = labelNames.filter((name, index) => labelNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
        throw new Error(`Duplicate label names detected: ${[...new Set(duplicates)].join(', ')}.`);
    }
    core.info(`Configuration validated successfully: ${config.labels.length} labels found.`);
}
/**
 * Validates the action inputs.
 *
 * @param inputs - The action inputs to validate
 * @throws Error if the inputs are invalid
 */
function validateInputs(inputs) {
    if (!inputs.configFile || inputs.configFile.trim().length === 0) {
        throw new Error('Input "config_file" must not be empty.');
    }
    if (!inputs.githubToken || inputs.githubToken.trim().length === 0) {
        throw new Error('Input "github_token" must not be empty.');
    }
}
//# sourceMappingURL=validators.js.map