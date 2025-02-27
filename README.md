# JOB CONN - FBLA Web Coding & Development 2025

[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](https://opensource.org/licenses/proprietary)

A platform connecting high school students with business recruiters through project-based opportunities.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Workflow](#workflow)
- [User Guides](#user-guides)
- [Technical Details](#technical-details)
- [License](#license)
- [Contributors](#contributors)

## Overview 🌐
JOB CONN bridges the gap between high school students and business recruiters through a network of collaborative projects. Our platform enables:
- Student-recruiter connections
- Project-based job postings
- Application management
- Subscription-based recruiter services

## Features ✨

### User Roles
| Role       | Capabilities                                  |
|------------|-----------------------------------------------|
| Student    | Apply to jobs, Manage applications            |
| Recruiter  | Post jobs, Manage postings, Handle applicants |
| Admin      | Moderate content, Manage users                |
| Guest      | Basic browsing, Registration                  |

## Workflow 🛠️
![Workflow Diagram](workflow-diagram.png) *Add actual diagram path*

**Color Coding:**
- 🔴 Admin Functions
- 🟡 Student Functions
- 🔵 Recruiter Functions
- 🟢 Universal Functions

## User Guides 📘

### Registration & Verification
1. Navigate to Login/Register
2. Choose role (Student/Recruiter)
3. Complete registration form
4. Verify email with code
5. Access role-specific dashboard

### Job Management (Recruiters)
```mermaid
graph TD
    A[Create Job Post] --> B[Admin Approval]
    B --> C{Approved?}
    C -->|Yes| D[Public Listing]
    C -->|No| E[Edit & Resubmit]
