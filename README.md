# GitHub Label Manager

A lightweight GitHub Action that automatically creates, updates, and manages repository labels based on a YAML configuration file. Ensures labels remain consistent and synchronized across repositories. Ideal for teams looking for an automated and unified approach to managing their GitHub labels.

---

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [With Options](#with-options)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Additional Resources](#additional-resources)

---

## Features

- **Automated Label Management** – Create, update, and delete labels automatically  
- **Color Normalization** – Handles hex color codes with or without `#`  
- **Detailed Outputs** – Provides counts for created, updated, deleted, and ignored labels  
- **Enterprise Support** – Works with GitHub Enterprise Server  
- **Ignore Flag** – Skip specific labels during sync  
- **Multiple Sources** – Load config from local files, URLs, or other repositories  
- **Optional Deletion** – Control whether missing labels are removed  
- **YAML Configuration** – Define labels in a simple, human-readable format  

---

## Usage

### Basic Setup

```yaml
name: Synchronize Labels
on:
  push:
    branches: [ main ]
    paths:
      - '.github/config/repository-labels.yml'
  workflow_dispatch:

jobs:
  synchronize-labels:
    permissions:
      contents: read 
      issues: write
    runs-on: ubuntu-latest
    steps:
      - name: Synchronize repository labels
        uses: lukas-kuntze/devx-action-label-manager@v1
        with:
          config_file: .github/config/repository-labels.yml
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### With Options

#### Delete Unlisted Labels

```yaml
- uses: lukas-kuntze/devx-action-label-manager@v1
  with:
    config_file: .github/config/repository-labels.yml
    delete_missing: true
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

#### GitHub Enterprise Server

```yaml
- uses: lukas-kuntze/devx-action-label-manager@v1
  with:
    config_file: .github/config/repository-labels.yml
    github_api_url: https://github.example.com/api/v3
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

#### Load from Different Sources

```yaml
# Local file (default)
config_file: .github/config/repository-labels.yml

# From URL
config_file: https://raw.githubusercontent.com/org/repo/main/repository-labels.yml

# From another repository
config_file: organization/shared-configs/repository-labels.yml
```

### Inputs

| Input            | Description                            | Default                                | Required |
|------------------|----------------------------------------|----------------------------------------|----------|
| `config_file`    | Path to YAML configuration file        | `.github/config/repository-labels.yml` | No       |
| `delete_missing` | Delete labels not defined in config    | `false`                                | No       |
| `github_token`   | GitHub token for authentication        | –                                      | **Yes**  |
| `github_api_url` | GitHub API URL (for Enterprise Server) | `https://api.github.com`               | No       |

### Outputs

| Output | Description |
|--------|-------------|
| `labels_created` | Number of labels that were created |
| `labels_updated` | Number of labels that were updated |
| `labels_deleted` | Number of labels that were deleted |
| `labels_skipped` | Number of labels already up-to-date |
| `labels_ignored` | Number of labels skipped due to ignore flag |

---

## Configuration

Create a YAML file (e.g. `.github/config/repository-labels.yml`):

```yaml
labels:
  - name: feat
    color: '154C79'
    description: This label marks tasks for developing or adding new functionality to the project.

  - name: fix
    color: 'BC0003'
    description: This label marks tasks that fix issues or bugs in the code.

  - name: docs
    color: 'E4DA8A'
    description: This label marks tasks to update, improve, or extend project documentation.
    ignore: true
```

### Label Properties

| Property      | Description                       | Required |
|---------------|-----------------------------------|----------|
| `name`        | Label name (max 50 chars)         | **Yes**  |
| `color`       | Hex color without `#`             | **Yes**  |
| `description` | Short description (max 100 chars) | No       |
| `ignore`      | Skip this label during sync       | No       |

---

## How It Works

1. **Load** – Fetches configuration from file, URL, or repository
2. **Validate** – Checks names, colors, and duplicates
3. **Compare** – Fetches existing labels and detects changes
4. **Sync** – Creates, updates, or deletes labels
5. **Report** – Outputs statistics

---

## Requirements

| Permission       | Purpose                   |
|------------------|---------------------------|
| `contents: read` | Read configuration files  |
| `issues: write`  | Manage repository labels  |

> **Note:** No checkout required – configuration is loaded via GitHub API.

---

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)
- [GitHub Labels API](https://docs.github.com/en/rest/issues/labels)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [YAML Syntax](https://yaml.org/spec/1.2.2/)
