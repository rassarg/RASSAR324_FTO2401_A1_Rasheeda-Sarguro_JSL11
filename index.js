// TASK: import helper functions from utils
import {
  getTasks,
  createNewTask,
  deleteTask,
  putTask,
} from "./utils/taskFunctions.js";
// TASK: import initialData
import { initialData } from "./initialData.js";

/*************************************************************************************************************************************************
SETUP CODE
***********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify(initialData));
    localStorage.setItem("showSideBar", "false");
  } else {
    console.log("Data already exists in localStorage");
  }
}
initializeData();

// DOM ELEMENTS //

const elements = {
  // Add new task modal elements:
  addNew: document.getElementById("add-new-task-btn"),
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"),
  createNewTaskBtn: document.getElementById("create-task-btn"),
  modal: document.getElementById("new-task-modal-window"),
  title: document.getElementById("title-input"),
  desc: document.getElementById("desc-input"),
  status: document.getElementById("select-status"),

  // Editing current task modal elements:
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  deleteTaskBtn: document.getElementById("delete-task-btn"),
  editTaskTitleInput: document.getElementById("edit-task-title-input"),
  editTaskDescInput: document.getElementById("edit-task-desc-input"),
  editTaskModal: document.querySelector(".edit-task-modal-window"),
  editSelectStatus: document.getElementById("edit-select-status"),
  modalWindow: document.getElementById("edit-task-form"),
  saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),

  // Nav SideBar elements:
  hideSideBarDiv: document.querySelector(".hide-side-bar-div"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  logo: document.getElementById("logo"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  sideBar: document.querySelector(".side-bar"),
  themeSwitch: document.getElementById("switch"),

  // Other elements:
  columnDivs: document.querySelectorAll(".column-div"),
  filterDiv: document.getElementById("filterDiv"),
  headerBoardName: document.getElementById("header-board-name"),
};

let activeBoard = "";

// Extracts unique board names from tasks

function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map((task) => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Displays different boards in the DOM

function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ""; // Clears the container
  boards.forEach((board) => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.

function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter((task) => task.board === boardName); // Filter tasks based on the specified board name

  elements.columnDivs.forEach((column) => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    const columnHeader = column.querySelector(".columnHeader");
    columnHeader.textContent = status.toUpperCase();

    const tasksContainer = column.querySelector(".tasks-container");
    tasksContainer.innerHTML = ""; // Clear existing tasks

    // Filter tasks again to get only those with the current status
    filteredTasks
      .filter((task) => task.status === status)
      .forEach((task) => {
        // Check if the task element already exists in the column
        const existingTaskElement = tasksContainer.querySelector(
          `.task-div[data-task-id="${task.id}"]`
        );
        if (existingTaskElement) {
          // Update existing task element
          existingTaskElement.textContent = task.title;
        } else {
          // Create new task element
          const taskElement = document.createElement("div");
          taskElement.classList.add("task-div");
          taskElement.textContent = task.title;
          taskElement.setAttribute("data-task-id", task.id);

          // Listen for a click event on each task and open a modal
          taskElement.addEventListener("click", () => {
            openEditTaskModal(task);
          });

          tasksContainer.appendChild(taskElement);
        }
      });
  });
}

// Update the tasks UI based on the active board
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll(".board-btn").forEach((btn) => {
    if (btn.textContent === boardName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Add a task to the UI based on the status
function addTaskToUI(task) {
  const column = document.querySelector(
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }
  // Checks if task container within column exists, otherwise create one
  let tasksContainer = column.querySelector(".tasks-container");
  if (!tasksContainer) {
    console.warn(
      `Tasks container not found for status: ${task.status}, creating one.`
    );
    tasksContainer = document.createElement("div"); // create a column if it doesn't exist
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);
  }

  // Create a new task element and set its properties
  const taskElement = document.createElement("div");
  taskElement.className = "task-div";
  taskElement.textContent = task.title; // Modify as needed: `${task.title} - ${task.description}`; // Display task title and description
  taskElement.setAttribute("data-task-id", task.id);

  tasksContainer.appendChild(taskElement);
  console.log(`Title '${task.title}' added to ${task.status} column.`);
}

/***************************************************************************
 EVENT LISTENERS 
***************************************************************************/

function setupEventListeners() {
  // EDIT TASK:

  // Edit task form
  elements.modalWindow.addEventListener("submit", (event) => {
    addTask(event);
  });
  // Cancel editing task
  elements.cancelEditBtn.addEventListener("click", () => {
    toggleModal(false, elements.editTaskModal);
    elements.filterDiv.style.display = "none";
  });
  // Clicking outside the task modal to close it
  elements.filterDiv.addEventListener("click", () => {
    toggleModal(false); //hides Add new task modal
    elements.editTaskModal.style.display = "none"; // Hides edit task modal
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
  });

  //ADD NEW TASK:
  //  Add New Task Btn
  elements.addNew.addEventListener("click", () => {
    elements.filterDiv.style.display = "block";
    elements.modal.style.display = "block";
  });
  // Cancel Add New Task Btn
  elements.cancelAddTaskBtn.addEventListener("click", () => {
    toggleModal(false, elements.modal);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
  });

  // Create New Task event listener
  elements.createNewTaskBtn.addEventListener("click", () => {
    elements.filterDiv.style.display = "block"; // Also show the filter overlay
    toggleModal(true);
  });
  // Submit Add New Task Form
  elements.modal.addEventListener("submit", addTask);

  // OTHERS:
  // Hide / Show sideBar
  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));

  // Theme Switch
  elements.themeSwitch.addEventListener("change", toggleTheme);
}

/*************************************************************************************************************************************************
FUNCTION CODE
 ***********************************************************************************************************************************************/

// Toggle Add New Task modal
function toggleModal(show, modal = elements.modal) {
  modal.style.display = show ? "block" : "none";
}

// Adding New Task
function addTask(event) {
  event.preventDefault();

  // Checks if title of task is empty
  if (!elements.title.value.trim()) {
    alert("Please add a title");
    return;
  }

  // task object with form values
  const task = {
    title: elements.title.value,
    description: elements.desc.value,
    status: elements.status.value,
    board: activeBoard,
  };
  // Create a new task and add it to the UI
  const newTask = createNewTask(task);
  if (newTask) {
    task.title = newTask.title;
    task.description = newTask.description;
    task.status = newTask.status;
    addTaskToUI(newTask);
    toggleModal(false, elements.modal);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
    event.target.reset(); // Reset the form
    refreshTasksUI(); // Refresh the tasks UI
  }
}
// Toggle sideBar
function toggleSidebar(show) {
  elements.showSideBarBtn.style.display = show ? "none" : "flex"; // Show/hide sideBar btn
  elements.sideBar.style.display = show ? "flex" : "none"; // Show/hide the sideBar
  elements.hideSideBarDiv.style.display = show ? "flex" : "none"; // Show/hide the 'hideSideBarDiv'
  localStorage.setItem("showSideBar", show ? "true" : "false"); // Store the show/hide state of the sidebar in local storage
  // show the filter overlay on screens < 480px
  if (show) {
    if (window.matchMedia("(max-width: 480px)").matches) {
      elements.filterDiv.style.display = "block";
    }
  }
}

// Default view of SideBar on screen sizes < 480px
if (window.matchMedia("(max-width: 480px)").matches) {
  elements.filterDiv.style.display = "none";
  toggleSidebar(false);
}
// Clicking outside the SideBar to close it
elements.filterDiv.addEventListener("click", () => {
  elements.filterDiv.style.display = "none";
  toggleSidebar(false);
});

// Event listener for hideSideBarBtn
elements.hideSideBarBtn.addEventListener("click", () => {
  elements.filterDiv.style.display = "none";
  toggleSidebar(false);
});

// Hiding the logo on screen sizes < 480px
if (window.matchMedia("(max-width: 480px)").matches) {
  document.querySelector(".logo-mobile").style.display = "none";
}

// Toggling & Storing the light / dark theme
function toggleTheme() {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLightTheme ? "light" : "dark"); // Stores the current theme in localStorage
  elements.logo.src = isLightTheme // Update the logo based on the theme
    ? "./assets/logo-light.svg"
    : "./assets/logo-dark.svg";
  localStorage.setItem("logo", isLightTheme ? "light" : "dark"); // Stores the current logo in localStorage
}

// Edit a task
function openEditTaskModal(task) {
  // Set task details in modal inputs
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  // Call saveTaskChanges upon clicking Save Changes button
  elements.saveTaskChangesBtn.addEventListener("click", () => {
    saveTaskChanges(task.id);
  });

  // Add event listener to delete task button
  elements.deleteTaskBtn.addEventListener("click", function confirmDelete() {
    // Display a confirmation window to delete task
    const confirmed = window.confirm(
      `Are you sure you want to delete the task '${task.title}'?`
    );
    if (confirmed) {
      // Delete task using a helper function
      deleteTask(task.id);
      console.log(`Task ${task.title} has been deleted`);

      // After deleting the task, close the modal
      toggleModal(false, elements.editTaskModal);
      elements.filterDiv.style.display = "none";

      // Remove the task element from the DOM
      const taskElement = document.querySelector(
        `.task-div[data-task-id="${task.id}"]`
      );
      if (taskElement) {
        taskElement.remove();
      }
      // Remove event listener for deleteTaskBtn
      elements.deleteTaskBtn.removeEventListener("click", confirmDelete);
    } else {
      // If delete is not confirmed, remove the event listener for deleteTaskBtn
      elements.deleteTaskBtn.removeEventListener("click", confirmDelete);
    }
  });

  //  Display the task modal and filter overlay
  elements.editTaskModal.style.display = "block";
  elements.filterDiv.style.display = "block";
  // Refresh the tasks UI
  refreshTasksUI();
}

// Saving Changes to a Task
function saveTaskChanges(taskId) {
  // Get new user inputs
  const updatedTaskTitle = elements.editTaskTitleInput.value;
  const updatedTaskDescription = elements.editTaskDescInput.value;
  const updatedTaskStatus = elements.editSelectStatus.value;

  // Create an object with the updated task details
  const updatedTask = {
    id: taskId,
    title: updatedTaskTitle,
    description: updatedTaskDescription,
    status: updatedTaskStatus,
    board: activeBoard,
  };
  console.log(
    `Task: '${updatedTask.title}' has been moved to status column: '${updatedTask.status}'`
  );
  // Update task using a helper function
  putTask(taskId, updatedTask);
  // Close the modal and hide the filter overlay
  toggleModal(false, elements.editTaskModal);
  elements.filterDiv.style.display = "none";
  // Refresh the tasks UI
  refreshTasksUI();
}

/*************************************************************************************************************************************************/

// Calls the fn to setup the App
document.addEventListener("DOMContentLoaded", function () {
  init(); // init is called after the DOM is fully loaded
});

// Initialize application
function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true"; //toggle the sideBar based on localStorage
  toggleSidebar(showSidebar);

  // Check if either 'light-theme' or 'theme' is set to 'light' in localStorage
  const isLightTheme = localStorage.getItem("theme") === "light";
  document.body.classList.toggle("light-theme", isLightTheme); // Toggle the 'light-theme' class on the body based on the theme setting
  elements.themeSwitch.checked = isLightTheme; // Set the state of the theme switch based on the theme setting
  elements.logo.src = isLightTheme // Set the logo source based on the theme setting
    ? "./assets/logo-light.svg"
    : "./assets/logo-dark.svg";

  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
