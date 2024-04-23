// TASK: import helper functions from utils
import {
  getTasks,
  createNewTask,
  patchTask,
  deleteTask,
} from "./utils/taskFunctions.js";
// TASK: import initialData
import { initialData } from "./initialData.js";

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify(initialData));
    localStorage.setItem("showSideBar", "true");
  } else {
    console.log("Data already exists in localStorage");
  }
}

initializeData();

// DOM ELEMENTS //
const elements = {
  // Add new task modal elements:
  addNew: document.getElementById("add-new-task-btn"), // Btn to Add New Task
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"), // Btn to cancel 'Add new task' in modal
  createNewTaskBtn: document.getElementById("create-task-btn"), // Btn to save newly created task in 'add new task' modal
  modal: document.getElementById("new-task-modal-window"),
  title: document.getElementById("title-input"),
  desc: document.getElementById("desc-input"),
  status: document.getElementById("select-status"),

  // Editing current task modal elements:
  cancelEditBtn: document.getElementById("cancel-edit-btn"), // Btn to cancel editing task
  deleteTaskBtn: document.getElementById("delete-task-btn"), // Btn to delete task
  editTaskTitleInput: document.getElementById("edit-task-title-input"), // Input to edit task-title
  editTaskDescInput: document.getElementById("edit-task-desc-input"), // Input to edit task-description
  editTaskModal: document.querySelector(".edit-task-modal-window"), //Edit task modal
  editSelectStatus: document.getElementById("edit-select-status"), // Select for status in modal
  modalWindow: document.getElementById("edit-task-form"),
  saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),

  // Nav SideBar elements:
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"), // Btn to hide Side Bar
  logo: document.getElementById("logo"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"), // Show Side Bar Button
  themeSwitch: document.getElementById("switch"), // Toggle button

  // Other elements:
  columnDivs: document.querySelectorAll(".column-div"),
  filterDiv: document.getElementById("filterDiv"),
  headerBoardName: document.getElementById("header-board-name"), // Header board name
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

// Creates different boards in the DOM

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
  const filteredTasks = tasks.filter((task) => task.board === boardName);

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  elements.columnDivs.forEach((column) => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks
      .filter((task) => task.status === status)
      .forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task-div");
        taskElement.textContent = task.title;
        taskElement.setAttribute("data-task-id", task.id);

        // Listen for a click event on each task and open a modal
        taskElement.addEventListener("click", () => {
          openEditTaskModal(task);
        });

        tasksContainer.appendChild(taskElement);
      });
  });
}

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

function addTaskToUI(task) {
  const column = document.querySelector(
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector(".tasks-container");
  if (!tasksContainer) {
    console.warn(
      `Tasks container not found for status: ${task.status}, creating one.`
    );
    tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement("div");
  taskElement.className = "task-div";
  taskElement.textContent = task.title; // Modify as needed: `${task.title} - ${task.description}`; // Display task title and description
  taskElement.setAttribute("data-task-id", task.id);

  tasksContainer.appendChild(taskElement);
}

// EVENT LISTENERS //
function setupEventListeners() {
  // Cancel editing task event listener
  elements.cancelEditBtn.addEventListener("click", () => {
    toggleModal(false, elements.editTaskModal);
    elements.filterDiv.style.display = "none";
  });

  // Cancel adding new task event listener
  elements.cancelAddTaskBtn.addEventListener("click", () => {
    toggleModal(false, elements.modal);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener("click", () => {
    toggleModal(false); //hides Add new task modal
    elements.editTaskModal.style.display = "none"; // Hides edit task modal
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener("change", toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener("click", () => {
    elements.filterDiv.style.display = "block"; // Also show the filter overlay
    toggleModal(true);
  });

  // Edit Task Modal:
  // elements.editTaskModal.addEventListener("click", () => {
  //   if (elements.editTaskModal.style.display !== "block") {
  //     elements.filterDiv.style.display = "block";
  //   }
  // });

  // elements.editTaskModal.style.display = "none";

  // Open Add New Task Modal event listener
  elements.addNew.addEventListener("click", () => {
    elements.filterDiv.style.display = "block";
    openNewTaskModal();
  });

  // Submit Add New Task Form event listener
  elements.modal.addEventListener("submit", addTask);

  // Submit edit form event listener
  elements.modalWindow.addEventListener("submit", (event) => {
    addTask(event);
  });
}

// Toggles tasks modal

function toggleModal(show, modal = elements.modal) {
  modal.style.display = show ? "block" : "none";
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function openNewTaskModal() {
  elements.modal.style.display = "block";
}

function addTask(event) {
  event.preventDefault();

  // TODO check if values are empty
  const task = {
    status: elements.status.value,
    title: elements.title.value,
    description: elements.desc.value,
    board: activeBoard,
  };
  // Create a new task object without passing any arguments
  const newTask = createNewTask(task);
  if (newTask) {
    task.title = newTask.title;
    task.description = newTask.description;
    task.status = newTask.status;
    addTaskToUI(newTask);
    toggleModal(false, elements.modal);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
    //event.target.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  const sidebar = document.querySelector(".side-bar");
  const hideSideBarDiv = document.querySelector(".hide-side-bar-div");

  elements.showSideBarBtn.style.display = show ? "none" : "block"; // Hide the button when sidebar is shown
  sidebar.style.display = show ? "flex" : "none";
  localStorage.setItem("showSideBar", show ? "true" : "false");

  // Makes the "hideSideBarDiv" appear on screens < 480px
  hideSideBarDiv.style.display = window.matchMedia("(max-width: 480px)").matches
    ? show
      ? "flex"
      : "none"
    : "flex";

  // Set the default view of .side-bar to display: none on screens < 480px
  window.matchMedia("(max-width: 480px)").matches
    ? ((sidebar.style.display = "none"),
      localStorage.setItem("sidebarHidden", "true"))
    : localStorage.setItem("sidebarHidden", "false");
}

function toggleTheme() {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLightTheme ? "light" : "dark");
  elements.logo.src = isLightTheme
    ? "./assets/logo-light.svg"
    : "./assets/logo-dark.svg";
  localStorage.setItem("logo", isLightTheme ? "light" : "dark");
}

function openEditTaskModal(task) {
  // Set task details in modal inputs
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  // Get button elements from the task modal & call saveTaskChanges upon click of Save Changes button
  elements.saveTaskChangesBtn.addEventListener("click", () => {
    saveTaskChanges(task.id);
  });
  // Delete task using a helper function
  // Delete task event listener
  elements.deleteTaskBtn.addEventListener("click", () => {
    deleteTask(task.id);

    // Remove the task element from the DOM
    const taskElement = document.querySelector(
      `.task-div[data-task-id="${task.id}"]`
    );
    if (taskElement) {
      taskElement.remove();
    }

    // After deleting the task, close the modal
    toggleModal(false, elements.editTaskModal);
    elements.filterDiv.style.display = "none";
  });
  //  close the task modal
  elements.editTaskModal.style.display = "block";
  elements.filterDiv.style.display = "block";
}

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
  };
  // Update task using a helper function
  patchTask(taskId, updatedTask);
  // Close the modal and refresh the UI to reflect the changes
  toggleModal(false, elements.editTaskModal);
  elements.filterDiv.style.display = "none";

  refreshTasksUI();
}

/*************************************************************************************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar(showSidebar);

  // Check if either 'light-theme' or 'theme' is set to 'light' in localStorage
  const isLightTheme = localStorage.getItem("theme") === "light";
  document.body.classList.toggle("light-theme", isLightTheme);
  elements.themeSwitch.checked = isLightTheme;
  elements.logo.src = isLightTheme
    ? "./assets/logo-light.svg"
    : "./assets/logo-dark.svg";

  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
