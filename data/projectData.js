/**
 * Project Data Repository
 * 
 * This file contains the official list of projects available in the Weekly Percentage Tracker.
 * Each project has the following properties:
 * - id: A unique identifier for the project
 * - name: The display name of the project
 * - code: A project code (format: PREFIX-###)
 */

// Official projects data
const projectData = [
  {
    "id": "CP000022",
    "name": "General R&D Infrastructure",
    "code": "CP000022",
    "color": "#2E7AB8"
  },
  {
    "id": "CP000038",
    "name": "Stld Changeover Costs",
    "code": "CP000038",
    "color": "#D55E00"
  },
  {
    "id": "CP000039",
    "name": "Unapplied Engineering Time",
    "code": "CP000039",
    "color": "#009E73"
  },
  {
    "id": "MS000002",
    "name": "NPI ST PX Series",
    "code": "MS000002",
    "color": "#CC79A7"
  },
  {
    "id": "PE000005",
    "name": "ENG MFG Support",
    "code": "PE000005",
    "color": "#F0E442"
  },
  {
    "id": "RD000026",
    "name": "Sales Orders",
    "code": "RD000026",
    "color": "#0072B2"
  },
  {
    "id": "RD000027",
    "name": "PMO-025 - PXG V3",
    "code": "RD000027",
    "color": "#E69F00"
  },
  {
    "id": "RD000042",
    "name": "PX G 1300 Product Support",
    "code": "RD000042",
    "color": "#56B4E9"
  },
  {
    "id": "RD000043",
    "name": "PX G Controls",
    "code": "RD000043",
    "color": "#8B2E2E"
  },
  {
    "id": "RD000047",
    "name": "PX Pump Train II",
    "code": "RD000047",
    "color": "#44AA99"
  },
  {
    "id": "RD000048",
    "name": "DOE - PXG for Heat Pump",
    "code": "RD000048",
    "color": "#882255"
  },
  {
    "id": "VO000008",
    "name": "Water Sales Support",
    "code": "VO000008",
    "color": "#117733"
  },
  {
    "id": "VO000009",
    "name": "PX, Turbo, Pump, Support",
    "code": "VO000009",
    "color": "#DDCC77"
  },
  {
    "id": "VO000010",
    "name": "IPD Evaluation, PX Cost Reduction",
    "code": "VO000010",
    "color": "#CC6677"
  },
  {
    "id": "VO000011",
    "name": "HP pump improvements",
    "code": "VO000011",
    "color": "#AA4499"
  },
  {
    "id": "VO000012",
    "name": "PX Power Improvements",
    "code": "VO000012",
    "color": "#4477AA"
  },
  {
    "id": "VO000013",
    "name": "PX Q500 Development",
    "code": "VO000013",
    "color": "#999933"
  },
  {
    "id": "WD000007",
    "name": "PX Q400 COGS Reduction",
    "code": "WD000007",
    "color": "#661100"
  },
  {
    "id": "WD000009",
    "name": "Turbo Std 550 and 875",
    "code": "WD000009",
    "color": "#88CCEE"
  }
]

/**
 * Get all available projects
 * @returns {Array} Array of project objects
 */
function getAllProjects() {
  return projectData;
}

/**
 * Get a project by its ID
 * @param {number} id - The project ID to search for
 * @returns {Object|null} The project object or null if not found
 */
function getProjectById(id) {
  return projectData.find(project => project.id === parseInt(id)) || null;
}

/**
 * Get a project by its code
 * @param {string} code - The project code to search for
 * @returns {Object|null} The project object or null if not found
 */
function getProjectByCode(code) {
  return projectData.find(project => project.code === code) || null;
}

// Expose the data and functions to the window object
window.projectData = {
  projects: projectData,
  getAllProjects,
  getProjectById,
  getProjectByCode
};