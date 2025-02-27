#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Define task tools in order: Project, Helper tools, Task Tools, Label Tools. 

// Project Tools
const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_get_projects",
  description: "Get all projects from Todoist",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const CREATE_PROJECT_TOOL: Tool = {
  name: "todoist_create_project",
  description: "Create a new project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the project"
      },
      parent_id: {
        type: "string",
        description: "Parent project ID for nested projects (optional)"
      },
      color: {
        type: "string",
        description: "Color of the project (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      favorite: {
        type: "boolean",
        description: "Whether the project is a favorite (optional)"
      }
    },
    required: ["name"]
  }
};

const UPDATE_PROJECT_TOOL: Tool = {
  name: "todoist_update_project",
  description: "Update an existing project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project to update"
      },
      name: {
        type: "string",
        description: "New name for the project (optional)"
      },
      color: {
        type: "string",
        description: "New color for the project (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      favorite: {
        type: "boolean",
        description: "Whether the project should be a favorite (optional)"
      }
    },
    required: ["project_id"]
  }
};

const GET_PROJECT_SECTIONS_TOOL: Tool = {
  name: "todoist_get_project_sections",
  description: "Get all sections in a Todoist project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project"
      }
    },
    required: ["project_id"]
  }
};

// Helper tools
const CREATE_SECTION_TOOL: Tool = {
  name: "todoist_create_section",
  description: "Create a new section in a Todoist project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project"
      },
      name: {
        type: "string",
        description: "Name of the section"
      },
      order: {
        type: "number",
        description: "Order of the section (optional)"
      }
    },
    required: ["project_id", "name"]
  }
};

// General Task tools

const CREATE_TASK_TOOL: Tool = {
  name: "todoist_create_task",
  description: "Create one or more tasks in Todoist with full parameter support",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to create (for batch operations)",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content/title of the task (required)"
            },
            description: {
              type: "string",
              description: "Detailed description of the task (optional)"
            },
            project_id: {
              type: "string",
              description: "ID of the project to add the task to (optional)"
            },
            section_id: {
              type: "string",
              description: "ID of the section to add the task to (optional)"
            },
            parent_id: {
              type: "string",
              description: "ID of the parent task for subtasks (optional)"
            },
            order: {
              type: "number",
              description: "Position in the project or parent task (optional)"
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Array of label names to apply to the task (optional)"
            },
            priority: {
              type: "number",
              description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
              enum: [1, 2, 3, 4]
            },
            due_string: {
              type: "string",
              description: "Natural language due date like 'tomorrow', 'next Monday' (optional)"
            },
            due_date: {
              type: "string",
              description: "Due date in YYYY-MM-DD format (optional)"
            },
            due_datetime: {
              type: "string",
              description: "Due date and time in RFC3339 format (optional)"
            },
            due_lang: {
              type: "string",
              description: "2-letter language code for due date parsing (optional)"
            },
            assignee_id: {
              type: "string",
              description: "User ID to assign the task to (optional)"
            },
            duration: {
              type: "number",
              description: "The duration amount of the task (optional)"
            },
            duration_unit: {
              type: "string",
              description: "The duration unit ('minute' or 'day') (optional)",
              enum: ["minute", "day"]
            },
            deadline_date: {
              type: "string", 
              description: "Deadline date in YYYY-MM-DD format (optional)"
            },
            deadline_lang: {
              type: "string",
              description: "2-letter language code for deadline parsing (optional)"
            }
          },
          required: ["content"]
        }
      },
      // For backward compatibility - single task parameters
      content: {
        type: "string",
        description: "The content/title of the task (for single task creation)"
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)"
      },
      project_id: {
        type: "string",
        description: "ID of the project to add the task to (optional)"
      },
      section_id: {
        type: "string",
        description: "ID of the section to add the task to (optional)"
      },
      parent_id: {
        type: "string",
        description: "ID of the parent task for subtasks (optional)"
      },
      order: {
        type: "number",
        description: "Position in the project or parent task (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to apply to the task (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      due_string: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday' (optional)"
      },
      due_date: {
        type: "string",
        description: "Due date in YYYY-MM-DD format (optional)"
      },
      due_datetime: {
        type: "string",
        description: "Due date and time in RFC3339 format (optional)"
      },
      due_lang: {
        type: "string",
        description: "2-letter language code for due date parsing (optional)"
      },
      assignee_id: {
        type: "string",
        description: "User ID to assign the task to (optional)"
      },
      duration: {
        type: "number",
        description: "The duration amount of the task (optional)"
      },
      duration_unit: {
        type: "string",
        description: "The duration unit ('minute' or 'day') (optional)",
        enum: ["minute", "day"]
      },
      deadline_date: {
        type: "string", 
        description: "Deadline date in YYYY-MM-DD format (optional)"
      },
      deadline_lang: {
        type: "string",
        description: "2-letter language code for deadline parsing (optional)"
      }
    }
  }
};

const GET_TASKS_TOOL: Tool = {
  name: "todoist_get_tasks",
  description: "Get a list of tasks from Todoist with various filters - handles both single and batch retrieval",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)"
      },
      section_id: {
        type: "string",
        description: "Filter tasks by section ID (optional)"
      },
      label: {
        type: "string",
        description: "Filter tasks by label name (optional)"
      },
      filter: {
        type: "string",
        description: "Natural language filter like 'today', 'tomorrow', 'next week', 'priority 1', 'overdue' (optional)"
      },
      lang: {
        type: "string",
        description: "IETF language tag defining what language filter is written in (optional)"
      },
      ids: {
        type: "array",
        items: { type: "string" },
        description: "Array of specific task IDs to retrieve (optional)"
      },
      priority: {
        type: "number",
        description: "Filter by priority level (1-4) (optional)",
        enum: [1, 2, 3, 4]
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional, client-side filtering)",
        default: 10
      }
    }
  }
};

const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_update_task",
  description: "Update one or more tasks in Todoist with full parameter support",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to update (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to update (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for (if ID not provided)"
            },
            content: {
              type: "string",
              description: "New content/title for the task (optional)"
            },
            description: {
              type: "string",
              description: "New description for the task (optional)"
            },
            project_id: {
              type: "string",
              description: "Move task to this project ID (optional)"
            },
            section_id: {
              type: "string",
              description: "Move task to this section ID (optional)"
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "New array of label names for the task (optional)"
            },
            priority: {
              type: "number",
              description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
              enum: [1, 2, 3, 4]
            },
            due_string: {
              type: "string",
              description: "New due date in natural language (optional)"
            },
            due_date: {
              type: "string",
              description: "New due date in YYYY-MM-DD format (optional)"
            },
            due_datetime: {
              type: "string",
              description: "New due date and time in RFC3339 format (optional)"
            },
            due_lang: {
              type: "string",
              description: "2-letter language code for due date parsing (optional)"
            },
            assignee_id: {
              type: "string",
              description: "New user ID to assign the task to (optional)"
            },
            duration: {
              type: "number",
              description: "New duration amount of the task (optional)"
            },
            duration_unit: {
              type: "string",
              description: "New duration unit ('minute' or 'day') (optional)",
              enum: ["minute", "day"]
            },
            deadline_date: {
              type: "string", 
              description: "New deadline date in YYYY-MM-DD format (optional)"
            },
            deadline_lang: {
              type: "string",
              description: "2-letter language code for deadline parsing (optional)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to update (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for (if ID not provided)"
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)"
      },
      description: {
        type: "string",
        description: "New description for the task (optional)"
      },
      project_id: {
        type: "string",
        description: "Move task to this project ID (optional)"
      },
      section_id: {
        type: "string",
        description: "Move task to this section ID (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "New array of label names for the task (optional)"
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      due_string: {
        type: "string",
        description: "New due date in natural language (optional)"
      },
      due_date: {
        type: "string",
        description: "New due date in YYYY-MM-DD format (optional)"
      },
      due_datetime: {
        type: "string",
        description: "New due date and time in RFC3339 format (optional)"
      },
      due_lang: {
        type: "string",
        description: "2-letter language code for due date parsing (optional)"
      },
      assignee_id: {
        type: "string",
        description: "New user ID to assign the task to (optional)"
      },
      duration: {
        type: "number",
        description: "New duration amount of the task (optional)"
      },
      duration_unit: {
        type: "string",
        description: "New duration unit ('minute' or 'day') (optional)",
        enum: ["minute", "day"]
      },
      deadline_date: {
        type: "string", 
        description: "New deadline date in YYYY-MM-DD format (optional)"
      },
      deadline_lang: {
        type: "string",
        description: "2-letter language code for deadline parsing (optional)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

const DELETE_TASK_TOOL: Tool = {
  name: "todoist_delete_task",
  description: "Delete one or more tasks from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to delete (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to delete (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for and delete (if ID not provided)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to delete (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and delete (if ID not provided)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_complete_task",
  description: "Mark one or more tasks as complete in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to mark as complete (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to complete (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for and complete (if ID not provided)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to complete (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and complete (if ID not provided)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

// Personal Label Management Tools
const GET_PERSONAL_LABELS_TOOL: Tool = {
  name: "todoist_get_personal_labels",
  description: "Get all personal labels from Todoist",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const CREATE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_create_personal_label",
  description: "Create a new personal label in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the label"
      },
      color: {
        type: "string",
        description: "Color of the label (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      order: {
        type: "number",
        description: "Order of the label (optional)"
      },
      is_favorite: {
        type: "boolean",
        description: "Whether the label is a favorite (optional)"
      }
    },
    required: ["name"]
  }
};

const GET_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_get_personal_label",
  description: "Get a personal label by ID",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description: "ID of the label to retrieve"
      }
    },
    required: ["label_id"]
  }
};

const UPDATE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_update_personal_label",
  description: "Update an existing personal label in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description: "ID of the label to update"
      },
      name: {
        type: "string",
        description: "New name for the label (optional)"
      },
      color: {
        type: "string",
        description: "New color for the label (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      order: {
        type: "number",
        description: "New order for the label (optional)"
      },
      is_favorite: {
        type: "boolean",
        description: "Whether the label is a favorite (optional)"
      }
    },
    required: ["label_id"]
  }
};

const DELETE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_delete_personal_label",
  description: "Delete a personal label from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description: "ID of the label to delete"
      }
    },
    required: ["label_id"]
  }
};

// Task Label Management Tool
const UPDATE_TASK_LABELS_TOOL: Tool = {
  name: "todoist_update_task_labels",
  description: "Update the labels of a task in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to update labels for"
      },
      labels: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of label names to set for the task"
      }
    },
    required: ["task_name", "labels"]
  }
};

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Check for API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN!;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client
const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

// Task Tools TypeGuards

function isCreateTaskArgs(args: unknown): args is {
  content?: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string;
  duration?: number;
  duration_unit?: string;
  deadline_date?: string;
  deadline_lang?: string;
  tasks?: Array<{
    content: string;
    description?: string;
    project_id?: string;
    section_id?: string;
    parent_id?: string;
    order?: number;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
    deadline_lang?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      "content" in task && 
      typeof task.content === "string"
    );
  }
  
  // Check if it's a single task operation
  return "content" in args && typeof (args as any).content === "string";
}

function isGetTasksArgs(args: unknown): args is {
  project_id?: string;
  section_id?: string;
  label?: string;
  filter?: string;
  lang?: string;
  ids?: string[];
  priority?: number;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null
  );
}

function isUpdateTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  content?: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string;
  duration?: number;
  duration_unit?: string;
  deadline_date?: string;
  deadline_lang?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
    content?: string;
    description?: string;
    project_id?: string;
    section_id?: string;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
    deadline_lang?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

function isDeleteTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

function isCompleteTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

// Project Tools TypeGuards

function isGetProjectsArgs(args: unknown): args is {} {
  return typeof args === "object" && args !== null;
}

function isCreateProjectArgs(args: unknown): args is {
  name: string;
  parent_id?: string;
  color?: string;
  favorite?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isUpdateProjectArgs(args: unknown): args is {
  project_id: string;
  name?: string;
  color?: string;
  favorite?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "project_id" in args &&
    typeof (args as { project_id: string }).project_id === "string"
  );
}

function isGetProjectSectionsArgs(args: unknown): args is {
  project_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "project_id" in args &&
    typeof (args as { project_id: string }).project_id === "string"
  );
}

function isCreateSectionArgs(args: unknown): args is {
  project_id: string;
  name: string;
  order?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "project_id" in args &&
    "name" in args &&
    typeof (args as { project_id: string; name: string }).project_id === "string" &&
    typeof (args as { project_id: string; name: string }).name === "string"
  );
}

// Label Tools TypeGuards

function isGetPersonalLabelsArgs(args: unknown): args is {} {
  return typeof args === "object" && args !== null;
}

function isCreatePersonalLabelArgs(args: unknown): args is {
  name: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isGetPersonalLabelArgs(args: unknown): args is {
  label_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "label_id" in args &&
    typeof (args as { label_id: string }).label_id === "string"
  );
}

function isUpdatePersonalLabelArgs(args: unknown): args is {
  label_id: string;
  name?: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "label_id" in args &&
    typeof (args as { label_id: string }).label_id === "string"
  );
}

function isDeletePersonalLabelArgs(args: unknown): args is {
  label_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "label_id" in args &&
    typeof (args as { label_id: string }).label_id === "string"
  );
}

function isUpdateTaskLabelsArgs(args: unknown): args is {
  task_name: string;
  labels: string[];
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    "labels" in args &&
    typeof (args as { task_name: string }).task_name === "string" &&
    Array.isArray((args as { labels: string[] }).labels)
  );
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    CREATE_TASK_TOOL,
    GET_TASKS_TOOL,
    UPDATE_TASK_TOOL,
    DELETE_TASK_TOOL,
    COMPLETE_TASK_TOOL,
    GET_PROJECTS_TOOL,
    CREATE_PROJECT_TOOL,
    UPDATE_PROJECT_TOOL,
    GET_PROJECT_SECTIONS_TOOL,
    CREATE_SECTION_TOOL,
    GET_PERSONAL_LABELS_TOOL,
    CREATE_PERSONAL_LABEL_TOOL,
    GET_PERSONAL_LABEL_TOOL,
    UPDATE_PERSONAL_LABEL_TOOL,
    DELETE_PERSONAL_LABEL_TOOL,
    UPDATE_TASK_LABELS_TOOL
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    // Original MCP handlers.
    if (!args) {
      throw new Error("No arguments provided");
    }
    // Project Handlers
    if (name === "todoist_get_projects") {
      if (!isGetProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_projects");
      }
      const projects = await todoistClient.getProjects();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(projects, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_project") {
      if (!isCreateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_project");
      }
      const project = await todoistClient.addProject({
        name: args.name,
        parentId: args.parent_id,
        color: args.color,
        isFavorite: args.favorite
      });
      return {
        content: [{
          type: "text",
          text: `Project created:\n${JSON.stringify(project, null, 2)}`
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_project") {
      if (!isUpdateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_project");
      }
      const project = await todoistClient.updateProject(args.project_id, {
        name: args.name,
        color: args.color,
        isFavorite: args.favorite
      });
      return {
        content: [{
          type: "text",
          text: `Project updated:\n${JSON.stringify(project, null, 2)}`
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_project_sections") {
      if (!isGetProjectSectionsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_project_sections");
      }
      const sections = await todoistClient.getSections(args.project_id);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(sections, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_section") {
      if (!isCreateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_section");
      }
      const section = await todoistClient.addSection({
        projectId: args.project_id,
        name: args.name,
        order: args.order
      });
      return {
        content: [{
          type: "text",
          text: `Section created:\n${JSON.stringify(section, null, 2)}`
        }],
        isError: false,
      };
    }

    // Task Handlers    

    if (name === "todoist_create_task") {
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_task");
      }
    
      try {
        // Handle batch task creation
        if (args.tasks && args.tasks.length > 0) {
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Map our parameters to the Todoist API format
              const apiParams: any = {
                content: taskData.content,
                description: taskData.description,
                projectId: taskData.project_id,
                sectionId: taskData.section_id,
                parentId: taskData.parent_id,
                order: taskData.order,
                labels: taskData.labels,
                priority: taskData.priority,
                dueString: taskData.due_string,
                dueDate: taskData.due_date,
                dueDateTime: taskData.due_datetime,
                dueLang: taskData.due_lang,
                assigneeId: taskData.assignee_id,
              };
              
              // Handle duration parameters
              if (taskData.duration && taskData.duration_unit) {
                apiParams.duration = {
                  amount: taskData.duration,
                  unit: taskData.duration_unit
                };
              }
              
              // Handle deadline parameters
              if (taskData.deadline_date) {
                apiParams.deadlineDate = taskData.deadline_date;
              }
              if (taskData.deadline_lang) {
                apiParams.deadlineLang = taskData.deadline_lang;
              }
              
              const task = await todoistClient.addTask(apiParams);
              return {
                success: true,
                task
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        } 
        // Handle single task creation
        else if (args.content) {
          // Map our parameters to the Todoist API format
          const apiParams: any = {
            content: args.content,
            description: args.description,
            projectId: args.project_id,
            sectionId: args.section_id,
            parentId: args.parent_id,
            order: args.order,
            labels: args.labels,
            priority: args.priority,
            dueString: args.due_string,
            dueDate: args.due_date,
            dueDateTime: args.due_datetime,
            dueLang: args.due_lang,
            assigneeId: args.assignee_id,
          };
          
          // Handle duration parameters
          if (args.duration && args.duration_unit) {
            apiParams.duration = {
              amount: args.duration,
              unit: args.duration_unit
            };
          }
          
          // Handle deadline parameters
          if (args.deadline_date) {
            apiParams.deadlineDate = args.deadline_date;
          }
          if (args.deadline_lang) {
            apiParams.deadlineLang = args.deadline_lang;
          }
          
          const task = await todoistClient.addTask(apiParams);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                task
              }, null, 2)
            }],
            isError: false
          };
        } else {
          throw new Error("Either 'content' or 'tasks' must be provided");
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_get_tasks") {
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_tasks");
      }
    
      try {
        // Build API request parameters
        const requestParams: any = {};
        
        if (args.project_id) {
          requestParams.project_id = args.project_id;
        }
        
        if (args.section_id) {
          requestParams.section_id = args.section_id;
        }
        
        if (args.label) {
          requestParams.label = args.label;
        }
        
        if (args.filter) {
          requestParams.filter = args.filter;
        }
        
        if (args.lang) {
          requestParams.lang = args.lang;
        }
        
        if (args.ids && args.ids.length > 0) {
          requestParams.ids = args.ids;
        }
    
        // Get tasks with a single API call using appropriate filters
        const allTasks = await todoistClient.getTasks(requestParams);
        
        // Apply any additional client-side filtering
        let filteredTasks = allTasks;
        
        // Apply priority filter (API doesn't support this directly)
        if (args.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === args.priority);
        }
        
        // Apply limit
        if (args.limit && args.limit > 0 && filteredTasks.length > args.limit) {
          filteredTasks = filteredTasks.slice(0, args.limit);
        }
        
        // Format response as JSON for easier LLM parsing
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              tasks: filteredTasks,
              count: filteredTasks.length
            }, null, 2)
          }],
          isError: false,
        };
        
      } catch (error) {
        console.error('Error in todoist_get_tasks:', error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true,
        };
      }
    }

    if (name === "todoist_update_task") {
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task");
      }
    
      try {
        // Process batch update
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    taskData
                  };
                }
                
                taskId = matchingTask.id;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Build update parameters
              const updateData: any = {};
              if (taskData.content !== undefined) updateData.content = taskData.content;
              if (taskData.description !== undefined) updateData.description = taskData.description;
              if (taskData.project_id !== undefined) updateData.projectId = taskData.project_id;
              if (taskData.section_id !== undefined) updateData.sectionId = taskData.section_id;
              if (taskData.labels !== undefined) updateData.labels = taskData.labels;
              if (taskData.priority !== undefined) updateData.priority = taskData.priority;
              if (taskData.due_string !== undefined) updateData.dueString = taskData.due_string;
              if (taskData.due_date !== undefined) updateData.dueDate = taskData.due_date;
              if (taskData.due_datetime !== undefined) updateData.dueDateTime = taskData.due_datetime;
              if (taskData.due_lang !== undefined) updateData.dueLang = taskData.due_lang;
              if (taskData.assignee_id !== undefined) updateData.assigneeId = taskData.assignee_id;
              
              // Handle duration
              if (taskData.duration !== undefined && taskData.duration_unit !== undefined) {
                updateData.duration = {
                  amount: taskData.duration,
                  unit: taskData.duration_unit
                };
              } else if (taskData.duration === null) {
                updateData.duration = null; // Remove duration
              }
              
              // Handle deadline
              if (taskData.deadline_date !== undefined) {
                updateData.deadlineDate = taskData.deadline_date;
              }
              if (taskData.deadline_lang !== undefined) {
                updateData.deadlineLang = taskData.deadline_lang;
              }
    
              // Perform the update
              await todoistClient.updateTask(taskId, updateData);
              
              return {
                success: true,
                taskId: taskId,
                updated: updateData
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task update
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Build update parameters
          const updateData: any = {};
          if (args.content !== undefined) updateData.content = args.content;
          if (args.description !== undefined) updateData.description = args.description;
          if (args.project_id !== undefined) updateData.projectId = args.project_id;
          if (args.section_id !== undefined) updateData.sectionId = args.section_id;
          if (args.labels !== undefined) updateData.labels = args.labels;
          if (args.priority !== undefined) updateData.priority = args.priority;
          if (args.due_string !== undefined) updateData.dueString = args.due_string;
          if (args.due_date !== undefined) updateData.dueDate = args.due_date;
          if (args.due_datetime !== undefined) updateData.dueDateTime = args.due_datetime;
          if (args.due_lang !== undefined) updateData.dueLang = args.due_lang;
          if (args.assignee_id !== undefined) updateData.assigneeId = args.assignee_id;
          
          // Handle duration
          if (args.duration !== undefined && args.duration_unit !== undefined) {
            updateData.duration = {
              amount: args.duration,
              unit: args.duration_unit
            };
          } else if (args.duration === null) {
            updateData.duration = null; // Remove duration
          }
          
          // Handle deadline
          if (args.deadline_date !== undefined) {
            updateData.deadlineDate = args.deadline_date;
          }
          if (args.deadline_lang !== undefined) {
            updateData.deadlineLang = args.deadline_lang;
          }
    
          // Perform the update
          const updatedTask = await todoistClient.updateTask(taskId, updateData);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                task: updatedTask
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_delete_task") {
      if (!isDeleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_task");
      }
    
      try {
        // Process batch deletion
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              let taskContent = '';
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    task_name: taskData.task_name
                  };
                }
                
                taskId = matchingTask.id;
                taskContent = matchingTask.content;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Delete the task
              await todoistClient.deleteTask(taskId);
              
              return {
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task deletion
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          let taskContent = '';
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
            taskContent = matchingTask.content;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Delete the task
          await todoistClient.deleteTask(taskId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully deleted task${taskContent ? ': "' + taskContent + '"' : ' with ID: ' + taskId}`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_complete_task") {
      if (!isCompleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_complete_task");
      }
    
      try {
        // Process batch completion
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              let taskContent = '';
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    task_name: taskData.task_name
                  };
                }
                
                taskId = matchingTask.id;
                taskContent = matchingTask.content;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Complete the task
              await todoistClient.closeTask(taskId);
              
              return {
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task completion
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          let taskContent = '';
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
            taskContent = matchingTask.content;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Complete the task
          await todoistClient.closeTask(taskId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully completed task${taskContent ? ': "' + taskContent + '"' : ' with ID: ' + taskId}`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Label Management Handlers

    if (name === "todoist_get_personal_labels") {
      if (!isGetPersonalLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_personal_labels");
      }
      const labels = await todoistClient.getLabels();
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(labels, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_personal_label") {
      if (!isCreatePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_personal_label");
      }
      const label = await todoistClient.addLabel({
        name: args.name,
        color: args.color,
        order: args.order,
        isFavorite: args.is_favorite
      });
      return {
        content: [{ 
          type: "text", 
          text: `Label created:\n${JSON.stringify(label, null, 2)}`
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_personal_label") {
      if (!isGetPersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_personal_label");
      }
      const label = await todoistClient.getLabel(args.label_id);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(label, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_personal_label") {
      if (!isUpdatePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_personal_label");
      }
      const label = await todoistClient.updateLabel(args.label_id, {
        name: args.name,
        color: args.color,
        order: args.order,
        isFavorite: args.is_favorite
      });
      return {
        content: [{ 
          type: "text", 
          text: `Label updated:\n${JSON.stringify(label, null, 2)}`
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_personal_label") {
      if (!isDeletePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_personal_label");
      }
      await todoistClient.deleteLabel(args.label_id);
      return {
        content: [{ 
          type: "text", 
          text: `Successfully deleted label with ID: ${args.label_id}`
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_task_labels") {
      if (!isUpdateTaskLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task_labels");
      }
    
      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );
    
      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }
    
      // Update the task's labels
      const updatedTask = await todoistClient.updateTask(matchingTask.id, {
        labels: args.labels
      });

      return {
        content: [{ 
          type: "text", 
          text: `Labels updated for task "${matchingTask.content}":\n${JSON.stringify(updatedTask, null, 2)}` 
        }],
        isError: false,
      };
    }


    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todoist MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});